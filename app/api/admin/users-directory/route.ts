import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

interface MembershipRoleRow {
  profile_id: string;
  school_role: string;
  is_active: boolean;
  approval_status: string;
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

  let adminSupabase: any;
  try {
    adminSupabase = getSupabaseAdminClient() as any;
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const { data: actorProfile, error: actorProfileError } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", actorData.user.id)
    .maybeSingle();

  if (actorProfileError || (actorProfile as { platform_role: string | null } | null)?.platform_role !== "superadmin") {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { data: profileRows, error: profileReadError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, platform_role, preferred_locale, created_at")
    .order("created_at", { ascending: false });

  if (profileReadError) {
    return NextResponse.json({ ok: false, reason: "profiles-read-failed" }, { status: 500 });
  }

  const { data: membershipRows, error: membershipReadError } = await adminSupabase
    .from("school_memberships")
    .select("profile_id, school_role, is_active, approval_status");

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
  }> | null) ?? []).map((profileRow) => {
    const memberships = membershipByProfileId.get(profileRow.id) ?? [];
    const membershipRoles = memberships.map((membership) => membership.school_role);

    return {
      id: profileRow.id,
      fullName: profileRow.full_name,
      email: profileRow.email,
      platformRole: profileRow.platform_role,
      preferredLocale: profileRow.preferred_locale,
      createdAt: profileRow.created_at,
      membershipRoles,
    };
  });

  return NextResponse.json({ ok: true, users });
}
