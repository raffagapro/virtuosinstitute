import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { isValidCurpFormat } from "@/lib/curp";

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

interface PatchChildPayload {
  fullName?: string;
  dateOfBirth?: string;
  curp?: string;
  gradeLevel?: string;
  bloodType?: string | null;
  allergies?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  // Verify the caller is an approved parent
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

  const { id: studentId } = await params;

  // Verify the student is actually linked to this parent
  const { data: guardianRow } = await adminSupabase
    .from("student_guardians")
    .select("student_id")
    .eq("parent_profile_id", userData.user.id)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!guardianRow) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: PatchChildPayload;
  try {
    body = (await request.json()) as PatchChildPayload;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-body" }, { status: 400 });
  }

  const fullName = body.fullName?.trim();
  const curp = body.curp?.trim().toUpperCase();

  if (curp && !isValidCurpFormat(curp)) {
    return NextResponse.json({ ok: false, reason: "invalid-curp" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {};
  if (fullName) updatePayload.full_name = fullName;
  if (body.dateOfBirth) updatePayload.date_of_birth = body.dateOfBirth;
  if (curp) updatePayload.curp = curp;
  if (body.gradeLevel?.trim()) updatePayload.grade_level = body.gradeLevel.trim();
  if (body.bloodType !== undefined) updatePayload.blood_type = body.bloodType?.trim() || null;
  if (body.allergies !== undefined) updatePayload.allergies = body.allergies?.trim() || null;

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ ok: false, reason: "no-changes" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (adminSupabase.from("students") as any)
    .update(updatePayload)
    .eq("id", studentId);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ ok: false, reason: "duplicate-curp" }, { status: 409 });
    }
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
