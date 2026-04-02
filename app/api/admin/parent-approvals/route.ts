import { NextResponse } from "next/server";
import { defaultLocale, resolveLocale, type Locale } from "@/lib/i18n";
import { sendInviteEmail, InviteMailerConfigError } from "@/lib/invite-mailer";
import { buildParentApprovedEmail } from "@/lib/invite-templates/parent-approved";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import type { ApprovalStatus } from "@/lib/platform-onboarding";

interface ParentApprovalPayload {
  profileId: string;
  schoolId?: string;
  status: Exclude<ApprovalStatus, "pending">;
  notes?: string;
}

interface ParentApprovalRow {
  id: string;
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

  if (actorProfileError || (actorProfile as { platform_role: string | null } | null)?.platform_role !== "superadmin") {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { data: targetProfile, error: targetProfileError } = await adminSupabase
    .from("profiles")
    .select("email, full_name, preferred_locale")
    .eq("id", payload.profileId)
    .maybeSingle();

  if (targetProfileError) {
    return NextResponse.json({ ok: false, reason: "target-profile-read-failed" }, { status: 500 });
  }

  const { error: membershipUpdateError } = await adminSupabase
    .from("school_memberships")
    .update({ approval_status: payload.status, is_active: payload.status !== "suspended" })
    .eq("profile_id", payload.profileId)
    .eq("school_role", "parent");

  if (membershipUpdateError) {
    return NextResponse.json({ ok: false, reason: "membership-update-failed" }, { status: 500 });
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
