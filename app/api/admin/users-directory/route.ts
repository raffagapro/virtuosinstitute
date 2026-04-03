import { NextResponse } from "next/server";
import {
  canManageTargetRole,
  getAssignableRoles,
  getEffectiveManagementRole,
  type ActorScope,
} from "@/lib/role-assignment-policy";
import { getDisplayMembershipRole, hasPendingAuthorization } from "@/lib/membership-role";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

interface MembershipRoleRow {
  profile_id: string;
  school_role: string;
  is_active: boolean;
  approval_status: string;
  created_at: string;
  updated_at: string;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function GET(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: actorData, error: actorError } = await serverSupabase.auth.getUser(accessToken);
  if (actorError || !actorData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const { data: actorProfile, error: actorProfileError } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", actorData.user.id)
    .maybeSingle();

  if (actorProfileError) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const isSuperadmin = (actorProfile as { platform_role: string | null } | null)?.platform_role === "superadmin";

  let isOwner = false;
  let isCoordination = false;

  if (!isSuperadmin) {
    const { data: actorMembershipRows, error: actorMembershipError } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", actorData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    if (actorMembershipError) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }

    const actorRoles = (actorMembershipRows as Array<{ school_role: string }> | null) ?? [];
    isOwner = actorRoles.some((role) => role.school_role === "school_owner");
    isCoordination = actorRoles.some((role) => role.school_role === "coordination");
  }

  if (!isSuperadmin && !isOwner && !isCoordination) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const actorScope: ActorScope = isSuperadmin
    ? "superadmin"
    : isOwner
      ? "school_owner"
      : "coordination";

  const { data: profileRows, error: profileReadError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, platform_role, preferred_locale, created_at")
    .order("created_at", { ascending: false });

  if (profileReadError) {
    return NextResponse.json({ ok: false, reason: "profiles-read-failed" }, { status: 500 });
  }

  const { data: membershipRows, error: membershipReadError } = await adminSupabase
    .from("school_memberships")
    .select("profile_id, school_role, is_active, approval_status, created_at, updated_at");

  if (membershipReadError) {
    return NextResponse.json({ ok: false, reason: "memberships-read-failed" }, { status: 500 });
  }

  const membershipByProfileId = new Map<string, MembershipRoleRow[]>();
  ((membershipRows as MembershipRoleRow[] | null) ?? []).forEach((row) => {
    const existing = membershipByProfileId.get(row.profile_id) ?? [];
    existing.push(row);
    membershipByProfileId.set(row.profile_id, existing);
  });

  const users = ((profileRows as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    platform_role: string | null;
    preferred_locale: string;
    created_at: string;
  }> | null) ?? [])
    .filter((profileRow) => profileRow.platform_role !== "superadmin")
    .map((profileRow) => {
    const memberships = membershipByProfileId.get(profileRow.id) ?? [];
    const effectiveManagementRole = getEffectiveManagementRole({
      platformRole: profileRow.platform_role,
      memberships,
    });

    if (!canManageTargetRole(actorScope, effectiveManagementRole)) {
      return null;
    }

    const displayMembershipRole = getDisplayMembershipRole(memberships);
    const membershipRoles = displayMembershipRole ? [displayMembershipRole] : [];
    const isActiveMembership = memberships.some(
      (membership) => membership.is_active && membership.approval_status === "approved"
    );
    const pendingAuthorization = hasPendingAuthorization(memberships);
    const isActive = isActiveMembership;

    return {
      id: profileRow.id,
      fullName: profileRow.full_name,
      email: profileRow.email,
      platformRole: profileRow.platform_role,
      isActive,
      preferredLocale: profileRow.preferred_locale,
      createdAt: profileRow.created_at,
      membershipRoles,
      hasPendingAuthorization: pendingAuthorization,
    };
  })
    .filter((user): user is {
      id: string;
      fullName: string | null;
      email: string | null;
      platformRole: string | null;
      isActive: boolean;
      preferredLocale: string;
      createdAt: string;
      membershipRoles: string[];
      hasPendingAuthorization: boolean;
    } => Boolean(user));

  return NextResponse.json({
    ok: true,
    users,
    actorScope,
    assignableRoles: getAssignableRoles(actorScope),
  });
}
