import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { resolveEffectiveDashboardRole, resolveHighestHierarchyRole } from "@/lib/platform-onboarding";

interface MembershipRoleRow {
  school_role: string;
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
  const { data: userData, error: userError } = await serverSupabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  let adminSupabase: any;
  try {
    adminSupabase = getSupabaseAdminClient() as any;
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const { data: profileRow, error: profileReadError } = await adminSupabase
    .from("profiles")
    .select("full_name, email, platform_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileReadError) {
    return NextResponse.json({ ok: false, reason: "profile-read-failed" }, { status: 500 });
  }

  const { data: roleRows, error: roleReadError } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  if (roleReadError) {
    return NextResponse.json({ ok: false, reason: "role-read-failed" }, { status: 500 });
  }

  const typedProfile = (profileRow as unknown as {
    full_name: string | null;
    email: string | null;
    platform_role: string | null;
  } | null);

  const platformRole = typedProfile?.platform_role ?? null;
  const schoolRoles = ((roleRows as unknown as MembershipRoleRow[] | null) ?? []).map((row) => row.school_role);
  const effectiveRole = resolveEffectiveDashboardRole({
    platformRole,
    schoolRoles,
  });
  const highestRole = resolveHighestHierarchyRole({
    platformRole,
    schoolRoles,
  });

  const profilePath =
    effectiveRole === "superadmin"
      ? "/platfrom/dashboard/superadmin/profile"
      : effectiveRole === "staff"
        ? "/platfrom/dashboard/staff/profile"
        : "/platfrom/dashboard/parent/profile";

  return NextResponse.json({
    ok: true,
    fullName: typedProfile?.full_name ?? null,
    email: typedProfile?.email ?? userData.user.email ?? null,
    effectiveRole,
    highestRole,
    profilePath,
  });
}
