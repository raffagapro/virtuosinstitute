import { NextRequest, NextResponse } from "next/server";
import { canManageTargetRole, getEffectiveManagementRole, type ActorScope } from "@/lib/role-assignment-policy";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

interface UpdateUserProfileRequest {
  profileId: string;
  fullName?: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  preferredLocale?: string;
  isActive?: boolean;
}

interface ProfileMembership {
  schoolRole: string;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  isActive: boolean;
}

interface ParentProfileDetails {
  curp: string;
  rfc: string | null;
  profession: string | null;
  invoiceRequired: boolean;
}

interface StudentProfileDetails {
  curp: string | null;
  gradeLevel: string | null;
  bloodType: string | null;
  allergies: string | null;
  enrollmentDate: string | null;
  approvalStatus: string | null;
  onboardingStatus: string | null;
  dataAuthorizationSignedAt: string | null;
}

interface StudentProfileRow {
  curp: string | null;
  grade_level: string | null;
  blood_type: string | null;
  allergies: string | null;
  enrollment_date: string | null;
  approval_status: string | null;
  onboarding_status: string | null;
  data_authorization_signed_at: string | null;
}

interface ProfilePayload {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  preferredLocale: string;
  platformRole: string | null;
  isActive: boolean;
}

interface UpdateUserProfileResponse {
  ok: boolean;
  error?: string;
  profile?: ProfilePayload;
  memberships?: ProfileMembership[];
  parentProfile?: ParentProfileDetails | null;
  studentProfile?: StudentProfileDetails | null;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function resolveSuperadminAdminClient(accessToken: string): Promise<
  | { ok: true; adminSupabase: ReturnType<typeof getSupabaseAdminClient>; actorScope: ActorScope }
  | { ok: false; response: NextResponse<UpdateUserProfileResponse> }
> {
  const serverSupabase = getSupabaseServerClient();
  const { data: actorData, error: actorError } = await serverSupabase.auth.getUser(accessToken);
  if (actorError || !actorData.user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 }),
    };
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Service role missing" }, { status: 503 }),
    };
  }

  const { data: actorProfile, error: actorProfileError } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", actorData.user.id)
    .maybeSingle();

  if (actorProfileError) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
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
      return {
        ok: false,
        response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
      };
    }

    const actorRoles = (actorMembershipRows as Array<{ school_role: string }> | null) ?? [];
    isOwner = actorRoles.some((role) => role.school_role === "school_owner");
    isCoordination = actorRoles.some((role) => role.school_role === "coordination");
  }

  if (!isSuperadmin && !isOwner && !isCoordination) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  const actorScope: ActorScope = isSuperadmin
    ? "superadmin"
    : isOwner
      ? "school_owner"
      : isCoordination
        ? "coordination"
        : "none";

  return { ok: true, adminSupabase, actorScope };
}

async function fetchProfileComposite(adminSupabase: ReturnType<typeof getSupabaseAdminClient>, profileId: string) {
  const { data: profileRow, error: profileError } = await adminSupabase
    .from("profiles")
    .select("id, full_name, email, phone, date_of_birth, preferred_locale, platform_role")
    .eq("id", profileId)
    .maybeSingle();

  if (profileError || !profileRow) {
    return { ok: false as const, error: profileError?.message || "Profile not found" };
  }

  const { data: membershipRows, error: membershipError } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", profileId);

  if (membershipError) {
    return { ok: false as const, error: membershipError.message };
  }

  const { data: parentProfileRow } = await adminSupabase
    .from("parent_profiles")
    .select("curp, rfc, profession, invoice_required")
    .eq("profile_id", profileId)
    .maybeSingle();

  const studentSelect =
    "curp, grade_level, blood_type, allergies, enrollment_date, approval_status, onboarding_status, data_authorization_signed_at";

  const queryStudentByColumn = async (columnName: string) => {
    return adminSupabase
      .from("students")
      .select(studentSelect)
      .eq(columnName, profileId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  };

  let studentProfileRow: StudentProfileRow | null = null;
  let studentLookupErrorMessage: string | null = null;

  const initialStudentLookup = await queryStudentByColumn("created_by_parent_profile_id");
  studentProfileRow = (initialStudentLookup.data as StudentProfileRow | null) ?? null;
  studentLookupErrorMessage = initialStudentLookup.error?.message ?? null;

  if (
    studentLookupErrorMessage &&
    studentLookupErrorMessage.toLowerCase().includes("created_by_parent_profile_id")
  ) {
    const fallbackStudentLookup = await queryStudentByColumn("created_by_profile_id");
    studentProfileRow = (fallbackStudentLookup.data as StudentProfileRow | null) ?? null;
    studentLookupErrorMessage = fallbackStudentLookup.error?.message ?? null;
  }

  if (studentLookupErrorMessage) {
    console.warn("Could not resolve student profile details for user profile modal:", studentLookupErrorMessage);
  }

  const memberships = ((membershipRows as Array<{ school_role: string; approval_status: ProfileMembership["approvalStatus"]; is_active: boolean }> | null) ?? []).map((row) => ({
    schoolRole: row.school_role,
    approvalStatus: row.approval_status,
    isActive: row.is_active,
  }));

  const isActive = memberships.some((membership) => membership.isActive && membership.approvalStatus === "approved");

  const profile: ProfilePayload = {
    id: profileRow.id,
    fullName: profileRow.full_name,
    email: profileRow.email,
    phone: profileRow.phone,
    dateOfBirth: profileRow.date_of_birth,
    preferredLocale: profileRow.preferred_locale,
    platformRole: profileRow.platform_role,
    isActive,
  };

  const parentProfile = parentProfileRow
    ? {
      curp: parentProfileRow.curp,
      rfc: parentProfileRow.rfc,
      profession: parentProfileRow.profession,
      invoiceRequired: parentProfileRow.invoice_required,
    }
    : null;

  const studentProfile = studentProfileRow
    ? {
      curp: studentProfileRow.curp,
      gradeLevel: studentProfileRow.grade_level,
      bloodType: studentProfileRow.blood_type,
      allergies: studentProfileRow.allergies,
      enrollmentDate: studentProfileRow.enrollment_date,
      approvalStatus: studentProfileRow.approval_status,
      onboardingStatus: studentProfileRow.onboarding_status,
      dataAuthorizationSignedAt: studentProfileRow.data_authorization_signed_at,
    }
    : null;

  return {
    ok: true as const,
    profile,
    memberships,
    parentProfile,
    studentProfile,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<UpdateUserProfileResponse>> {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const superadminResult = await resolveSuperadminAdminClient(accessToken);
    if (!superadminResult.ok) {
      return superadminResult.response;
    }

    const profileId = request.nextUrl.searchParams.get("profileId")?.trim() || "";
    if (!profileId) {
      return NextResponse.json({ ok: false, error: "Invalid input: profileId required" }, { status: 400 });
    }

    const profileData = await fetchProfileComposite(superadminResult.adminSupabase, profileId);
    if (!profileData.ok) {
      return NextResponse.json({ ok: false, error: profileData.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: profileData.profile,
      memberships: profileData.memberships,
      parentProfile: profileData.parentProfile,
      studentProfile: profileData.studentProfile,
    });
  } catch (error) {
    console.error("Error reading user profile:", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<UpdateUserProfileResponse>> {
  try {
    const accessToken = getBearerToken(request);
    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const superadminResult = await resolveSuperadminAdminClient(accessToken);
    if (!superadminResult.ok) {
      return superadminResult.response;
    }

    const adminSupabase = superadminResult.adminSupabase;

    const body = (await request.json()) as UpdateUserProfileRequest;
    if (!body.profileId) {
      return NextResponse.json(
        { ok: false, error: "Invalid input: profileId required" },
        { status: 400 }
      );
    }

    const targetProfileData = await fetchProfileComposite(adminSupabase, body.profileId);
    if (!targetProfileData.ok) {
      return NextResponse.json(
        { ok: false, error: targetProfileData.error },
        { status: 500 }
      );
    }

    const targetRole = getEffectiveManagementRole({
      platformRole: targetProfileData.profile.platformRole,
      memberships: targetProfileData.memberships,
    });

    if (!canManageTargetRole(superadminResult.actorScope, targetRole)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Update profile table
    const profileUpdates: Record<string, unknown> = {};
    if (body.fullName !== undefined) profileUpdates.full_name = body.fullName;
    if (body.phone !== undefined) profileUpdates.phone = body.phone || null;
    if (body.dateOfBirth !== undefined) profileUpdates.date_of_birth = body.dateOfBirth || null;
    if (body.preferredLocale !== undefined) profileUpdates.preferred_locale = body.preferredLocale;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: updateError } = await adminSupabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", body.profileId);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: `Failed to update profile: ${updateError.message}` },
          { status: 500 }
        );
      }
    }

    // Update is_active in school_memberships if provided
    if (body.isActive !== undefined) {
      const { error: membershipError } = await adminSupabase
        .from("school_memberships")
        .update({ is_active: body.isActive })
        .eq("profile_id", body.profileId);

      if (membershipError) {
        return NextResponse.json(
          { ok: false, error: `Failed to update membership: ${membershipError.message}` },
          { status: 500 }
        );
      }
    }

    const profileData = await fetchProfileComposite(adminSupabase, body.profileId);
    if (!profileData.ok) {
      return NextResponse.json(
        { ok: false, error: `Failed to fetch updated profile: ${profileData.error}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: profileData.profile,
      memberships: profileData.memberships,
      parentProfile: profileData.parentProfile,
      studentProfile: profileData.studentProfile,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
