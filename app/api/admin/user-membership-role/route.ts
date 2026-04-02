import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

type SchoolRole = "school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest";

interface ReassignMembershipPayload {
  profileId?: string;
  schoolRole?: SchoolRole;
}

const allowedSchoolRoles: SchoolRole[] = [
  "school_owner",
  "direction",
  "coordination",
  "teacher",
  "clerk",
  "parent",
  "student",
  "guest",
];

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function isSchoolRole(value: unknown): value is SchoolRole {
  return typeof value === "string" && allowedSchoolRoles.includes(value as SchoolRole);
}

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const payload = (await request.json()) as ReassignMembershipPayload;
  if (!payload.profileId || !isSchoolRole(payload.schoolRole)) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
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

  if (actorProfileError) {
    return NextResponse.json({ ok: false, reason: "actor-profile-read-failed" }, { status: 500 });
  }

  const isSuperadmin = (actorProfile as { platform_role: string | null } | null)?.platform_role === "superadmin";

  let isOwner = false;
  if (!isSuperadmin) {
    const { data: actorMembershipRows, error: actorMembershipError } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", actorData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    if (actorMembershipError) {
      return NextResponse.json({ ok: false, reason: "actor-membership-read-failed" }, { status: 500 });
    }

    isOwner = ((actorMembershipRows as Array<{ school_role: string }> | null) ?? []).some(
      (membership) => membership.school_role === "school_owner"
    );
  }

  if (!isSuperadmin && !isOwner) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { data: targetProfile, error: targetProfileError } = await adminSupabase
    .from("profiles")
    .select("id, platform_role")
    .eq("id", payload.profileId)
    .maybeSingle();

  if (targetProfileError || !targetProfile) {
    return NextResponse.json({ ok: false, reason: "target-profile-read-failed" }, { status: 500 });
  }

  if ((targetProfile as { platform_role: string | null }).platform_role === "superadmin") {
    return NextResponse.json({ ok: false, reason: "forbidden-target" }, { status: 403 });
  }

  const { data: existingMembershipRows, error: existingMembershipReadError } = await adminSupabase
    .from("school_memberships")
    .select("id, school_role")
    .eq("profile_id", payload.profileId);

  if (existingMembershipReadError) {
    return NextResponse.json({ ok: false, reason: "membership-read-failed" }, { status: 500 });
  }

  const existingMemberships = (existingMembershipRows as Array<{ id: string; school_role: string }> | null) ?? [];

  if (existingMemberships.length > 0) {
    const existingIds = existingMemberships.map((membership) => membership.id);
    const { error: deactivateError } = await adminSupabase
      .from("school_memberships")
      .update({ is_active: false })
      .in("id", existingIds);

    if (deactivateError) {
      return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
    }
  }

  const matchingMembership = existingMemberships.find((membership) => membership.school_role === payload.schoolRole);

  if (matchingMembership) {
    const { error: updateRoleError } = await adminSupabase
      .from("school_memberships")
      .update({ approval_status: "approved", is_active: true })
      .eq("id", matchingMembership.id);

    if (updateRoleError) {
      return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
    }
  } else {
    const { error: insertRoleError } = await adminSupabase
      .from("school_memberships")
      .insert({
        profile_id: payload.profileId,
        school_role: payload.schoolRole,
        approval_status: "approved",
        is_active: true,
      });

    if (insertRoleError) {
      return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, schoolRole: payload.schoolRole });
}
