import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { isValidCurpFormat } from "@/lib/curp";

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

interface StudentRow {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  curp: string | null;
  grade_level: string | null;
  blood_type: string | null;
  allergies: string | null;
  data_authorization_signed_at: string | null;
  approval_status: string;
  onboarding_status: string;
  created_at: string;
}

interface RegisterChildPayload {
  fullName?: string;
  dateOfBirth?: string;
  curp?: string;
  gradeLevel?: string;
  bloodType?: string | null;
  allergies?: string | null;
  dataAuthorization?: boolean;
}

export async function GET(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: userData, error: userError } = await serverSupabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  // Verify the user has an approved parent membership
  const { data: membershipRows, error: membershipError } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", userData.user.id)
    .eq("school_role", "parent")
    .eq("approval_status", "approved")
    .eq("is_active", true);

  if (membershipError) {
    return NextResponse.json({ ok: false, reason: "membership-check-failed" }, { status: 500 });
  }

  const isApprovedParent = ((membershipRows as unknown as Array<{ school_role: string }> | null) ?? []).length > 0;
  if (!isApprovedParent) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Fetch students linked to this parent via student_guardians
  const { data: guardianRows, error: guardianError } = await adminSupabase
    .from("student_guardians")
    .select("student_id")
    .eq("parent_profile_id", userData.user.id);

  if (guardianError) {
    return NextResponse.json({ ok: false, reason: "children-read-failed" }, { status: 500 });
  }

  const studentIds = ((guardianRows as unknown as Array<{ student_id: string }> | null) ?? []).map(
    (row) => row.student_id
  );

  if (studentIds.length === 0) {
    return NextResponse.json({ ok: true, children: [] });
  }

  const { data: studentRows, error: studentsError } = await adminSupabase
    .from("students")
    .select("id, full_name, date_of_birth, curp, grade_level, blood_type, allergies, data_authorization_signed_at, approval_status, onboarding_status, created_at")
    .in("id", studentIds)
    .order("created_at", { ascending: false });

  if (studentsError) {
    return NextResponse.json({ ok: false, reason: "children-read-failed" }, { status: 500 });
  }

  const children = ((studentRows as unknown as StudentRow[] | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth ?? null,
    curp: row.curp ?? null,
    gradeLevel: row.grade_level ?? null,
    bloodType: row.blood_type ?? null,
    allergies: row.allergies ?? null,
    dataAuthorizationSignedAt: row.data_authorization_signed_at ?? null,
    approvalStatus: row.approval_status,
    onboardingStatus: row.onboarding_status,
    createdAt: row.created_at,
  }));

  return NextResponse.json({ ok: true, children });
}

export async function POST(request: NextRequest) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: userData, error: userError } = await serverSupabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  const payload = (await request.json()) as RegisterChildPayload;
  const fullName = payload.fullName?.trim();
  const dateOfBirth = payload.dateOfBirth?.trim();
  const curp = payload.curp?.trim().toUpperCase();
  const gradeLevel = payload.gradeLevel?.trim();

  if (!fullName || !dateOfBirth || !curp || !gradeLevel || !payload.dataAuthorization) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
  }

  if (!isValidCurpFormat(curp)) {
    return NextResponse.json({ ok: false, reason: "invalid-curp" }, { status: 400 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  // Verify the user has an approved parent membership
  const { data: membershipRows, error: membershipError } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", userData.user.id)
    .eq("school_role", "parent")
    .eq("approval_status", "approved")
    .eq("is_active", true);

  if (membershipError) {
    return NextResponse.json({ ok: false, reason: "membership-check-failed" }, { status: 500 });
  }

  const isApprovedParent = ((membershipRows as unknown as Array<{ school_role: string }> | null) ?? []).length > 0;
  if (!isApprovedParent) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Ensure a parent_profiles row exists for the FK on student_guardians.
  // We upsert with no CURP — the parent can fill that in their own profile later.
  const { error: parentProfileUpsertError } = await adminSupabase
    .from("parent_profiles")
    .upsert({ profile_id: userData.user.id }, { onConflict: "profile_id", ignoreDuplicates: true });

  if (parentProfileUpsertError) {
    return NextResponse.json({ ok: false, reason: "parent-profile-setup-failed" }, { status: 500 });
  }

  // Create the student record
  const { data: newStudent, error: studentInsertError } = await adminSupabase
    .from("students")
    .insert({
      full_name: fullName,
      date_of_birth: dateOfBirth,
      curp,
      grade_level: gradeLevel,
      blood_type: payload.bloodType?.trim() || null,
      allergies: payload.allergies?.trim() || null,
      data_authorization_signed_at: payload.dataAuthorization ? new Date().toISOString() : null,
      data_authorization_signed_by_profile_id: payload.dataAuthorization ? userData.user.id : null,
      onboarding_status: "submitted",
      approval_status: "pending",
      created_by_profile_id: userData.user.id,
    })
    .select("id")
    .single();

  if (studentInsertError || !newStudent) {
    console.error("[register-child] student insert error:", studentInsertError?.code, studentInsertError?.message);
    const isDuplicateCurp =
      (studentInsertError?.message ?? "").includes("students_school_curp_unique_idx") ||
      (studentInsertError?.code ?? "") === "23505";
    if (isDuplicateCurp) {
      return NextResponse.json({ ok: false, reason: "duplicate-curp" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "student-create-failed" }, { status: 500 });
  }

  const studentId = (newStudent as unknown as { id: string }).id;

  // Link the student to the parent via student_guardians
  const { error: guardianInsertError } = await adminSupabase
    .from("student_guardians")
    .insert({
      student_id: studentId,
      parent_profile_id: userData.user.id,
      relationship_type: "parent",
      is_primary_contact: true,
      is_legal_guardian: true,
      link_status: "approved",
    });

  if (guardianInsertError) {
    console.error("[register-child] guardian insert error:", guardianInsertError.code, guardianInsertError.message);
    // Roll back the student if the guardian link fails
    await adminSupabase.from("students").delete().eq("id", studentId);
    return NextResponse.json({ ok: false, reason: "guardian-link-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, studentId }, { status: 201 });
}
