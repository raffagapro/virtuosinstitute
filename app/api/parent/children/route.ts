import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

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
  approval_status: string;
  onboarding_status: string;
  created_at: string;
}

interface RegisterChildPayload {
  fullName?: string;
  dateOfBirth?: string | null;
  curp?: string | null;
  gradeLevel?: string | null;
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

  const isApprovedParent = ((membershipRows as Array<{ school_role: string }> | null) ?? []).length > 0;
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

  const studentIds = ((guardianRows as Array<{ student_id: string }> | null) ?? []).map(
    (row) => row.student_id
  );

  if (studentIds.length === 0) {
    return NextResponse.json({ ok: true, children: [] });
  }

  const { data: studentRows, error: studentsError } = await adminSupabase
    .from("students")
    .select("id, full_name, date_of_birth, curp, grade_level, approval_status, onboarding_status, created_at")
    .in("id", studentIds)
    .order("created_at", { ascending: false });

  if (studentsError) {
    return NextResponse.json({ ok: false, reason: "children-read-failed" }, { status: 500 });
  }

  const children = ((studentRows as StudentRow[] | null) ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: row.date_of_birth ?? null,
    curp: row.curp ?? null,
    gradeLevel: row.grade_level ?? null,
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
  if (!fullName) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
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
    .select("school_role")
    .eq("profile_id", userData.user.id)
    .eq("school_role", "parent")
    .eq("approval_status", "approved")
    .eq("is_active", true);

  if (membershipError) {
    return NextResponse.json({ ok: false, reason: "membership-check-failed" }, { status: 500 });
  }

  const isApprovedParent = ((membershipRows as Array<{ school_role: string }> | null) ?? []).length > 0;
  if (!isApprovedParent) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Create the student record
  const { data: newStudent, error: studentInsertError } = await adminSupabase
    .from("students")
    .insert({
      full_name: fullName,
      date_of_birth: payload.dateOfBirth ?? null,
      curp: payload.curp?.trim() || null,
      grade_level: payload.gradeLevel?.trim() || null,
      onboarding_status: "submitted",
      approval_status: "pending",
      created_by_profile_id: userData.user.id,
    })
    .select("id")
    .single();

  if (studentInsertError || !newStudent) {
    return NextResponse.json({ ok: false, reason: "student-create-failed" }, { status: 500 });
  }

  const studentId = (newStudent as { id: string }).id;

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
    // Roll back the student if the guardian link fails
    await adminSupabase.from("students").delete().eq("id", studentId);
    return NextResponse.json({ ok: false, reason: "guardian-link-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, studentId }, { status: 201 });
}
