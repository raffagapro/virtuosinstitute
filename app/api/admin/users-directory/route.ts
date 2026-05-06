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

interface StudentDirectoryData {
  curp: string | null;
  gradeLevel: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
  approvalStatus: string | null;
  onboardingStatus: string | null;
  dataAuthorizationSignedAt: string | null;
  guardianProfileId: string | null;
  guardianFullName: string | null;
  guardianEmail: string | null;
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

  const isSuperadmin = (actorProfile as unknown as { platform_role: string | null } | null)?.platform_role === "superadmin";

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

    const actorRoles = (actorMembershipRows as unknown as Array<{ school_role: string }> | null) ?? [];
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
  ((membershipRows as unknown as MembershipRoleRow[] | null) ?? []).forEach((row) => {
    const existing = membershipByProfileId.get(row.profile_id) ?? [];
    existing.push(row);
    membershipByProfileId.set(row.profile_id, existing);
  });

  const users = ((profileRows as unknown as Array<{
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

  // Fetch students and their first guardian for display
  const { data: studentRows } = await adminSupabase
    .from("students")
    .select("id, full_name, date_of_birth, curp, grade_level, blood_type, allergies, approval_status, onboarding_status, data_authorization_signed_at, created_at")
    .order("created_at", { ascending: false });

  const studentList = (studentRows as unknown as Array<{
    id: string;
    full_name: string | null;
    date_of_birth: string | null;
    curp: string | null;
    grade_level: string | null;
    blood_type: string | null;
    allergies: string | null;
    approval_status: string | null;
    onboarding_status: string | null;
    data_authorization_signed_at: string | null;
    created_at: string;
  }> | null) ?? [];

  const guardianByStudentId = new Map<string, { profileId: string; fullName: string | null; email: string | null }>();

  if (studentList.length > 0) {
    const studentIds = studentList.map((s) => s.id);
    const { data: guardianRows } = await adminSupabase
      .from("student_guardians")
      .select("student_id, parent_profile_id")
      .in("student_id", studentIds);

    const uniqueGuardianProfileIds = [
      ...new Set(((guardianRows as unknown as Array<{ student_id: string; parent_profile_id: string }> | null) ?? []).map((g) => g.parent_profile_id)),
    ];

    if (uniqueGuardianProfileIds.length > 0) {
      const { data: guardianProfileRows } = await adminSupabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", uniqueGuardianProfileIds);

      const guardianProfileMap = new Map<string, { fullName: string | null; email: string | null }>();
      ((guardianProfileRows as unknown as Array<{ id: string; full_name: string | null; email: string | null }> | null) ?? [])
        .forEach((p) => guardianProfileMap.set(p.id, { fullName: p.full_name, email: p.email }));

      ((guardianRows as unknown as Array<{ student_id: string; parent_profile_id: string }> | null) ?? [])
        .forEach((g) => {
          if (!guardianByStudentId.has(g.student_id)) {
            const profile = guardianProfileMap.get(g.parent_profile_id);
            guardianByStudentId.set(g.student_id, {
              profileId: g.parent_profile_id,
              fullName: profile?.fullName ?? null,
              email: profile?.email ?? null,
            });
          }
        });
    }
  }

  // Build map: guardian profile id → list of students
  const studentsByGuardianId = new Map<string, Array<{ id: string; fullName: string | null; gradeLevel: string | null }>>();
  studentList.forEach((s) => {
    const guardian = guardianByStudentId.get(s.id);
    if (guardian) {
      const arr = studentsByGuardianId.get(guardian.profileId) ?? [];
      arr.push({ id: s.id, fullName: s.full_name, gradeLevel: s.grade_level });
      studentsByGuardianId.set(guardian.profileId, arr);
    }
  });

  // Attach linkedStudents to every profile-based user entry
  const usersWithLinked = users.map((u) => ({
    ...u,
    linkedStudents: studentsByGuardianId.get(u.id) ?? ([] as unknown as Array<{ id: string; fullName: string | null; gradeLevel: string | null }>),
  }));

  const studentEntries = studentList.map((s) => {
    const guardian = guardianByStudentId.get(s.id) ?? null;
    const studentData: StudentDirectoryData = {
      curp: s.curp,
      gradeLevel: s.grade_level,
      dateOfBirth: s.date_of_birth,
      bloodType: s.blood_type,
      allergies: s.allergies,
      approvalStatus: s.approval_status,
      onboardingStatus: s.onboarding_status,
      dataAuthorizationSignedAt: s.data_authorization_signed_at,
      guardianProfileId: guardian?.profileId ?? null,
      guardianFullName: guardian?.fullName ?? null,
      guardianEmail: guardian?.email ?? null,
    };

    return {
      id: s.id,
      fullName: s.full_name,
      email: null as string | null,
      platformRole: null as string | null,
      isActive: s.approval_status === "approved",
      preferredLocale: "es-MX",
      createdAt: s.created_at,
      membershipRoles: ["student"],
      hasPendingAuthorization: s.approval_status === "pending",
      isStudentRecord: true as const,
      studentData,
    };
  });

  return NextResponse.json({
    ok: true,
    users: [...usersWithLinked, ...studentEntries],
    actorScope,
    assignableRoles: getAssignableRoles(actorScope),
  });
}
