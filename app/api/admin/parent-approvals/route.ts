import { NextResponse } from "next/server";
import { defaultLocale, resolveLocale, type Locale } from "@/lib/i18n";
import { sendInviteEmail, InviteMailerConfigError } from "@/lib/invite-mailer";
import { buildParentApprovedEmail } from "@/lib/invite-templates/parent-approved";
import { canAssignRole, canManageTargetRole, getEffectiveManagementRole, type ActorScope } from "@/lib/role-assignment-policy";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import type { ApprovalStatus } from "@/lib/platform-onboarding";

interface ParentApprovalPayload {
  profileId: string;
  schoolId?: string;
  status: Exclude<ApprovalStatus, "pending">;
  assignedRole?: "school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest";
  notes?: string;
}

interface ParentApprovalRow {
  id: string;
}

interface MembershipUpdateRow {
  id: string;
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

function isApprovalStatus(value: unknown): value is Exclude<ApprovalStatus, "pending"> {
  return value === "approved" || value === "rejected" || value === "suspended";
}

function resolveProfileLocale(value: string | null | undefined): Locale {
  return resolveLocale(value ?? defaultLocale);
}

async function sendParentApprovedEmailIfPossible(input: {
  email: string | null;
  fullName: string | null;
  locale: Locale;
  requestOrigin: string;
}) {
  if (!input.email) {
    return;
  }

  const platformUrl = new URL("/platfrom", new URL(input.requestOrigin).origin).toString();
  const emailPayload = buildParentApprovedEmail({
    locale: input.locale,
    fullName: input.fullName,
    platformUrl,
  });

  try {
    await sendInviteEmail({
      ...emailPayload,
      toEmail: input.email,
    });
  } catch (error) {
    if (error instanceof InviteMailerConfigError) {
      console.warn("Parent approved email skipped due to missing mailer config.");
      return;
    }

    console.error("Parent approved email failed to send.", error);
  }
}

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: actorData, error: actorError } = await serverSupabase.auth.getUser(accessToken);
  if (actorError || !actorData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  const payload = (await request.json()) as ParentApprovalPayload;
  if (!payload.profileId || !isApprovalStatus(payload.status)) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
  }

  if (payload.status === "approved" && !payload.assignedRole) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
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
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }

    const actorRoles = (actorMembershipRows as Array<{ school_role: string }> | null) ?? [];
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

  if (payload.status === "approved" && payload.assignedRole && !canAssignRole(actorScope, payload.assignedRole)) {
    return NextResponse.json({ ok: false, reason: "forbidden-assigned-role" }, { status: 403 });
  }

  const { data: targetProfile, error: targetProfileError } = await adminSupabase
    .from("profiles")
    .select("email, full_name, preferred_locale, platform_role")
    .eq("id", payload.profileId)
    .maybeSingle();

  if (targetProfileError) {
    return NextResponse.json({ ok: false, reason: "target-profile-read-failed" }, { status: 500 });
  }

  if ((targetProfile as { platform_role: string | null } | null)?.platform_role === "superadmin") {
    return NextResponse.json({ ok: false, reason: "forbidden-target" }, { status: 403 });
  }

  const { data: targetMembershipRows, error: targetMembershipReadError } = await adminSupabase
    .from("school_memberships")
    .select("school_role, is_active, approval_status")
    .eq("profile_id", payload.profileId);

  if (targetMembershipReadError) {
    return NextResponse.json({ ok: false, reason: "membership-read-failed" }, { status: 500 });
  }

  const targetRole = getEffectiveManagementRole({
    platformRole: (targetProfile as { platform_role: string | null } | null)?.platform_role ?? null,
    memberships: ((targetMembershipRows as Array<{ school_role: string; is_active: boolean; approval_status: string }> | null) ?? []),
  });

  if (!canManageTargetRole(actorScope, targetRole)) {
    return NextResponse.json({ ok: false, reason: "forbidden-target" }, { status: 403 });
  }

  if (payload.status === "approved") {
    const { error: deactivateOtherMembershipsError } = await adminSupabase
      .from("school_memberships")
      .update({ is_active: false })
      .eq("profile_id", payload.profileId)
      .eq("is_active", true);

    if (deactivateOtherMembershipsError) {
      return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
    }

    const { data: pendingMembershipRows, error: pendingMembershipReadError } = await adminSupabase
      .from("school_memberships")
      .select("id, school_role")
      .eq("profile_id", payload.profileId)
      .in("school_role", ["guest", "parent"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (pendingMembershipReadError) {
      return NextResponse.json({ ok: false, reason: "membership-read-failed" }, { status: 500 });
    }

    const pendingMembership = ((pendingMembershipRows as MembershipUpdateRow[] | null) ?? [])[0] ?? null;

    if (pendingMembership) {
      const { error: membershipUpdateError } = await adminSupabase
        .from("school_memberships")
        .update({
          school_role: payload.assignedRole,
          approval_status: "approved",
          is_active: true,
        })
        .eq("id", pendingMembership.id);

      if (membershipUpdateError) {
        return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
      }
    } else {
      const { error: membershipInsertError } = await adminSupabase
        .from("school_memberships")
        .upsert(
          {
            profile_id: payload.profileId,
            school_role: payload.assignedRole,
            approval_status: "approved",
            is_active: true,
          },
          { onConflict: "profile_id,school_role" }
        );

      if (membershipInsertError) {
        return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
      }
    }
  } else {
    const { error: membershipUpdateError } = await adminSupabase
      .from("school_memberships")
      .update({ approval_status: payload.status, is_active: false })
      .eq("profile_id", payload.profileId)
      .in("school_role", ["guest", "parent"]);

    if (membershipUpdateError) {
      return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
    }
  }

  const { data: existingRows, error: approvalReadError } = await adminSupabase
    .from("parent_approval_requests")
    .select("id")
    .eq("profile_id", payload.profileId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (approvalReadError) {
    return NextResponse.json({ ok: false, reason: "approval-read-failed" }, { status: 500 });
  }

  const nowIso = new Date().toISOString();
  const notes = payload.notes?.trim() || null;

  const existingApprovalRows = (existingRows as ParentApprovalRow[] | null) ?? [];

  if (existingApprovalRows.length > 0) {
    const { error: approvalUpdateError } = await adminSupabase
      .from("parent_approval_requests")
      .update({
        status: payload.status,
        reviewed_at: nowIso,
        reviewed_by_profile_id: actorData.user.id,
        notes,
      })
      .eq("id", existingApprovalRows[0].id);

    if (approvalUpdateError) {
      return NextResponse.json({ ok: false, reason: "approval-update-failed" }, { status: 500 });
    }
  } else {
    const { error: approvalInsertError } = await adminSupabase
      .from("parent_approval_requests")
      .insert({
        profile_id: payload.profileId,
        status: payload.status,
        reviewed_at: nowIso,
        reviewed_by_profile_id: actorData.user.id,
        notes,
      });

    if (approvalInsertError) {
      return NextResponse.json({ ok: false, reason: "approval-create-failed" }, { status: 500 });
    }
  }

  if (payload.status === "approved") {
    const typedTargetProfile = (targetProfile as {
      email: string | null;
      full_name: string | null;
      preferred_locale: string | null;
    } | null);

    await sendParentApprovedEmailIfPossible({
      email: typedTargetProfile?.email ?? null,
      fullName: typedTargetProfile?.full_name ?? null,
      locale: resolveProfileLocale(typedTargetProfile?.preferred_locale),
      requestOrigin: request.url,
    });
  }

  return NextResponse.json({ ok: true, status: payload.status });
}
