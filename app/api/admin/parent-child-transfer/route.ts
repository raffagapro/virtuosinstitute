import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

type TransferAction = "request" | "confirm";

interface ParentChildTransferRequestBody {
  action?: TransferAction;
  sourceParentProfileId?: string;
  targetParentProfileId?: string;
  studentIds?: string[];
  contactedCurrentParent?: boolean;
  contactedTargetParent?: boolean;
  communicationNotes?: string;
  transferRequestId?: string;
  confirmPhrase?: string;
}

interface GuardianLinkRow {
  id: string;
  student_id: string;
  parent_profile_id: string;
  relationship_type: string;
  is_primary_contact: boolean;
  is_legal_guardian: boolean;
  link_status: string;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function resolveActor(accessToken: string) {
  const serverSupabase = getSupabaseServerClient();
  const { data: actorData, error: actorError } = await serverSupabase.auth.getUser(accessToken);
  if (actorError || !actorData.user) {
    return { ok: false as const, response: NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 }) };
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 }),
    };
  }

  const { data: actorProfile, error: actorProfileError } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", actorData.user.id)
    .maybeSingle();

  if (actorProfileError) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, reason: "actor-profile-read-failed" }, { status: 500 }),
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
        ok: false as const,
        response: NextResponse.json({ ok: false, reason: "actor-membership-read-failed" }, { status: 500 }),
      };
    }

    isOwner = ((actorMembershipRows as Array<{ school_role: string }> | null) ?? []).some(
      (membership) => membership.school_role === "school_owner"
    );

    isCoordination = ((actorMembershipRows as Array<{ school_role: string }> | null) ?? []).some(
      (membership) => membership.school_role === "coordination"
    );
  }

  if (!isSuperadmin && !isOwner && !isCoordination) {
    return { ok: false as const, response: NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, adminSupabase, actorId: actorData.user.id };
}

export async function GET(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const actorResult = await resolveActor(accessToken);
  if (!actorResult.ok) {
    return actorResult.response;
  }

  const url = new URL(request.url);
  const sourceParentProfileId = url.searchParams.get("sourceParentProfileId")?.trim() ?? "";
  if (!sourceParentProfileId) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
  }

  const { adminSupabase } = actorResult;

  const { data: linkedGuardianRows, error: linkedGuardianError } = await adminSupabase
    .from("student_guardians")
    .select("student_id, link_status, students(id, full_name, grade_level, approval_status)")
    .eq("parent_profile_id", sourceParentProfileId)
    .in("link_status", ["approved", "pending"]);

  if (linkedGuardianError) {
    return NextResponse.json({ ok: false, reason: "students-read-failed" }, { status: 500 });
  }

  const linkedStudents = ((linkedGuardianRows as Array<{
    student_id: string;
    link_status: string;
    students: { id: string; full_name: string; grade_level: string | null; approval_status: string } | null;
  }> | null) ?? [])
    .filter((row) => row.students)
    .map((row) => ({
      id: row.student_id,
      fullName: row.students?.full_name ?? "",
      gradeLevel: row.students?.grade_level ?? null,
      approvalStatus: row.students?.approval_status ?? null,
      guardianLinkStatus: row.link_status,
    }));

  const { data: parentMemberships, error: parentMembershipsError } = await adminSupabase
    .from("school_memberships")
    .select("profile_id")
    .eq("school_role", "parent")
    .eq("is_active", true)
    .eq("approval_status", "approved");

  if (parentMembershipsError) {
    return NextResponse.json({ ok: false, reason: "parents-read-failed" }, { status: 500 });
  }

  const candidateParentIds = Array.from(
    new Set(
      ((parentMemberships as Array<{ profile_id: string }> | null) ?? [])
        .map((row) => row.profile_id)
        .filter((profileId) => profileId !== sourceParentProfileId)
    )
  );

  let candidateParents: Array<{ id: string; fullName: string | null; email: string | null }> = [];
  if (candidateParentIds.length > 0) {
    const { data: parentProfiles, error: parentProfilesError } = await adminSupabase
      .from("profiles")
      .select("id, full_name, email, platform_role")
      .in("id", candidateParentIds)
      .order("full_name", { ascending: true });

    if (parentProfilesError) {
      return NextResponse.json({ ok: false, reason: "parents-read-failed" }, { status: 500 });
    }

    candidateParents = ((parentProfiles as Array<{
      id: string;
      full_name: string | null;
      email: string | null;
      platform_role: string | null;
    }> | null) ?? [])
      .filter((row) => row.platform_role !== "superadmin")
      .map((row) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
      }));
  }

  return NextResponse.json({
    ok: true,
    linkedStudents,
    candidateParents,
  });
}

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const actorResult = await resolveActor(accessToken);
  if (!actorResult.ok) {
    return actorResult.response;
  }

  const { adminSupabase, actorId } = actorResult;
  const payload = (await request.json()) as ParentChildTransferRequestBody;

  if (payload.action === "request") {
    if (
      !payload.sourceParentProfileId ||
      !payload.targetParentProfileId ||
      payload.sourceParentProfileId === payload.targetParentProfileId ||
      !Array.isArray(payload.studentIds) ||
      payload.studentIds.length === 0
    ) {
      return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
    }

    const uniqueStudentIds = Array.from(new Set(payload.studentIds.map((id) => id.trim()).filter(Boolean)));
    if (uniqueStudentIds.length === 0) {
      return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
    }

    const { data: sourceLinks, error: sourceLinksError } = await adminSupabase
      .from("student_guardians")
      .select("student_id")
      .eq("parent_profile_id", payload.sourceParentProfileId)
      .in("student_id", uniqueStudentIds)
      .in("link_status", ["approved", "pending"]);

    if (sourceLinksError) {
      return NextResponse.json({ ok: false, reason: "source-links-read-failed" }, { status: 500 });
    }

    const sourceLinkedStudentIds = new Set(((sourceLinks as Array<{ student_id: string }> | null) ?? []).map((row) => row.student_id));
    const missingSourceLinks = uniqueStudentIds.filter((studentId) => !sourceLinkedStudentIds.has(studentId));
    if (missingSourceLinks.length > 0) {
      return NextResponse.json({ ok: false, reason: "student-not-linked-to-source-parent" }, { status: 400 });
    }

    const { data: requestRow, error: requestError } = await adminSupabase
      .from("parent_child_transfer_requests")
      .insert({
        source_parent_profile_id: payload.sourceParentProfileId,
        target_parent_profile_id: payload.targetParentProfileId,
        student_ids: uniqueStudentIds,
        status: "pending_confirmation",
        initiated_by_profile_id: actorId,
        contacted_current_parent: Boolean(payload.contactedCurrentParent),
        contacted_target_parent: Boolean(payload.contactedTargetParent),
        communication_notes: payload.communicationNotes?.trim() || null,
      })
      .select("id")
      .single();

    if (requestError || !requestRow) {
      return NextResponse.json({ ok: false, reason: "request-create-failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      transferRequestId: requestRow.id,
      status: "pending_confirmation",
    });
  }

  if (payload.action === "confirm") {
    if (!payload.transferRequestId || payload.confirmPhrase !== "TRANSFER") {
      return NextResponse.json({ ok: false, reason: "invalid-confirmation" }, { status: 400 });
    }

    const { data: transferRequest, error: transferRequestError } = await adminSupabase
      .from("parent_child_transfer_requests")
      .select("id, source_parent_profile_id, target_parent_profile_id, student_ids, status")
      .eq("id", payload.transferRequestId)
      .maybeSingle();

    if (transferRequestError || !transferRequest) {
      return NextResponse.json({ ok: false, reason: "request-not-found" }, { status: 404 });
    }

    if (transferRequest.status !== "pending_confirmation") {
      return NextResponse.json({ ok: false, reason: "request-not-pending" }, { status: 400 });
    }

    const studentIds = (transferRequest.student_ids as string[] | null) ?? [];
    if (studentIds.length === 0) {
      return NextResponse.json({ ok: false, reason: "request-empty" }, { status: 400 });
    }

    const { data: sourceGuardianLinks, error: sourceGuardianLinksError } = await adminSupabase
      .from("student_guardians")
      .select("id, student_id, parent_profile_id, relationship_type, is_primary_contact, is_legal_guardian, link_status")
      .eq("parent_profile_id", transferRequest.source_parent_profile_id)
      .in("student_id", studentIds)
      .in("link_status", ["approved", "pending"]);

    if (sourceGuardianLinksError) {
      return NextResponse.json({ ok: false, reason: "source-links-read-failed" }, { status: 500 });
    }

    const sourceLinks = (sourceGuardianLinks as GuardianLinkRow[] | null) ?? [];
    if (sourceLinks.length === 0) {
      return NextResponse.json({ ok: false, reason: "source-links-missing" }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const sourceLinkIds = sourceLinks.map((link) => link.id);

    const { error: revokeError } = await adminSupabase
      .from("student_guardians")
      .update({
        link_status: "revoked",
        approved_at: nowIso,
        approved_by_profile_id: actorId,
      })
      .in("id", sourceLinkIds);

    if (revokeError) {
      return NextResponse.json({ ok: false, reason: "source-links-update-failed" }, { status: 500 });
    }

    for (const link of sourceLinks) {
      const { data: existingTargetLink, error: targetReadError } = await adminSupabase
        .from("student_guardians")
        .select("id")
        .eq("student_id", link.student_id)
        .eq("parent_profile_id", transferRequest.target_parent_profile_id)
        .maybeSingle();

      if (targetReadError) {
        return NextResponse.json({ ok: false, reason: "target-links-read-failed" }, { status: 500 });
      }

      if (existingTargetLink?.id) {
        const { error: targetUpdateError } = await adminSupabase
          .from("student_guardians")
          .update({
            relationship_type: link.relationship_type,
            is_legal_guardian: link.is_legal_guardian,
            is_primary_contact: link.is_primary_contact,
            link_status: "approved",
            approved_by_profile_id: actorId,
            approved_at: nowIso,
          })
          .eq("id", existingTargetLink.id);

        if (targetUpdateError) {
          return NextResponse.json({ ok: false, reason: "target-links-update-failed" }, { status: 500 });
        }
      } else {
        const { error: targetInsertError } = await adminSupabase
          .from("student_guardians")
          .insert({
            student_id: link.student_id,
            parent_profile_id: transferRequest.target_parent_profile_id,
            relationship_type: link.relationship_type || "guardian_transfer",
            is_primary_contact: link.is_primary_contact,
            is_legal_guardian: link.is_legal_guardian,
            link_status: "approved",
            approved_by_profile_id: actorId,
            approved_at: nowIso,
          });

        if (targetInsertError) {
          return NextResponse.json({ ok: false, reason: "target-links-insert-failed" }, { status: 500 });
        }
      }
    }

    const { error: closeRequestError } = await adminSupabase
      .from("parent_child_transfer_requests")
      .update({
        status: "confirmed",
        confirmed_by_profile_id: actorId,
        confirmed_at: nowIso,
      })
      .eq("id", transferRequest.id);

    if (closeRequestError) {
      return NextResponse.json({ ok: false, reason: "request-close-failed" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      status: "confirmed",
      transferredStudentCount: sourceLinks.length,
    });
  }

  return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
}
