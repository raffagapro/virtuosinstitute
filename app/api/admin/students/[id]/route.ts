import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

interface PatchStudentRequest {
  action: "approve" | "reject";
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
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

  const { data: actorProfile } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", actorData.user.id)
    .maybeSingle();

  const isSuperadmin = (actorProfile as unknown as { platform_role: string | null } | null)?.platform_role === "superadmin";

  if (!isSuperadmin) {
    const { data: actorMembershipRows } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", actorData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const actorRoles = (actorMembershipRows as unknown as Array<{ school_role: string }> | null) ?? [];
    const hasAccess = actorRoles.some(
      (r) => r.school_role === "school_owner" || r.school_role === "coordination"
    );

    if (!hasAccess) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  }

  const { id: studentId } = await params;
  if (!studentId) {
    return NextResponse.json({ ok: false, reason: "missing-student-id" }, { status: 400 });
  }

  let body: PatchStudentRequest;
  try {
    body = (await request.json()) as PatchStudentRequest;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-body" }, { status: 400 });
  }

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ ok: false, reason: "invalid-action" }, { status: 400 });
  }

  const isApprove = body.action === "approve";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: any = {
    approval_status: isApprove ? "approved" : "rejected",
  };

  if (isApprove) {
    updatePayload.onboarding_status = "approved";
    updatePayload.approved_by_profile_id = actorData.user.id;
    updatePayload.approved_at = new Date().toISOString();
  }

  const { error: updateError } = await adminSupabase
    .from("students")
    .update(updatePayload)
    .eq("id", studentId);

  if (updateError) {
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
