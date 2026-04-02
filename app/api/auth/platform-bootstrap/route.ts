import { NextResponse } from "next/server";
import { defaultLocale, resolveLocale, type Locale } from "@/lib/i18n";
import { sendInviteEmail, InviteMailerConfigError } from "@/lib/invite-mailer";
import { buildParentReviewEmail } from "@/lib/invite-templates/parent-review";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import {
  deriveParentApprovalStatus,
  resolveDashboardPath,
  resolveProfileIdentity,
  type ApprovalStatus,
} from "@/lib/platform-onboarding";

interface MembershipRow {
  id: string;
  approval_status: ApprovalStatus;
}

interface ParentApprovalRow {
  id: string;
  status: ApprovalStatus;
}

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

function resolveOnboardingLocale(user: { user_metadata?: Record<string, unknown> | null }) {
  const localeCandidate = typeof user.user_metadata?.preferred_locale === "string"
    ? user.user_metadata.preferred_locale
    : typeof user.user_metadata?.locale === "string"
      ? user.user_metadata.locale
      : defaultLocale;

  return resolveLocale(localeCandidate);
}

async function sendParentReviewEmailIfPossible(input: {
  email: string | null;
  fullName: string;
  locale: Locale;
  requestOrigin: string;
}) {
  if (!input.email) {
    return;
  }

  const homeUrl = new URL("/", requestOriginToBase(input.requestOrigin)).toString();
  const emailPayload = buildParentReviewEmail({
    locale: input.locale,
    fullName: input.fullName,
    homeUrl,
  });

  try {
    await sendInviteEmail({
      ...emailPayload,
      toEmail: input.email,
    });
  } catch (error) {
    if (error instanceof InviteMailerConfigError) {
      console.warn("Parent review email skipped due to missing mailer config.");
      return;
    }

    console.error("Parent review email failed to send.", error);
  }
}

function requestOriginToBase(requestUrl: string) {
  return new URL(requestUrl).origin;
}

export async function POST(request: Request) {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: userData, error: userError } = await serverSupabase.auth.getUser(accessToken);

  if (userError || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  const user = userData.user;
  const fullNameCandidate = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name
    : typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name
      : null;

  const { fullName, email } = resolveProfileIdentity({
    fullNameCandidate,
    email: user.email,
  });
  const locale = resolveOnboardingLocale(user);

  let adminSupabase: any;
  try {
    adminSupabase = getSupabaseAdminClient() as any;
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const { error: upsertProfileError } = await adminSupabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName,
        email,
        preferred_locale: "es-MX",
      },
      { onConflict: "id" }
    );

  if (upsertProfileError) {
    return NextResponse.json({ ok: false, reason: "profile-upsert-failed" }, { status: 500 });
  }

  const { data: profileRow, error: profileReadError } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileReadError) {
    return NextResponse.json({ ok: false, reason: "profile-read-failed" }, { status: 500 });
  }

  const { data: existingMembershipRows, error: membershipReadError } = await adminSupabase
    .from("school_memberships")
    .select("id, approval_status")
    .eq("profile_id", user.id)
    .eq("school_role", "parent")
    .order("created_at", { ascending: false })
    .limit(1);

  if (membershipReadError) {
    return NextResponse.json({ ok: false, reason: "membership-read-failed" }, { status: 500 });
  }

  let membership = ((existingMembershipRows as MembershipRow[] | null) ?? [])[0] ?? null;

  if (!membership) {
    const { error: insertMembershipError } = await adminSupabase
      .from("school_memberships")
      .insert({
        profile_id: user.id,
        school_role: "parent",
        is_active: true,
        approval_status: "pending",
      });

    if (insertMembershipError) {
      return NextResponse.json({ ok: false, reason: "membership-create-failed" }, { status: 500 });
    }

    const { data: createdMembershipRows, error: createdMembershipReadError } = await adminSupabase
      .from("school_memberships")
      .select("id, approval_status")
      .eq("profile_id", user.id)
      .eq("school_role", "parent")
      .order("created_at", { ascending: false })
      .limit(1);

    if (createdMembershipReadError) {
      return NextResponse.json({ ok: false, reason: "membership-read-failed" }, { status: 500 });
    }

    membership = ((createdMembershipRows as MembershipRow[] | null) ?? [])[0] ?? null;
  }

  if (!membership) {
    return NextResponse.json({ ok: false, reason: "membership-missing" }, { status: 500 });
  }

  const { data: approvalRows, error: approvalReadError } = await adminSupabase
    .from("parent_approval_requests")
    .select("id, status")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (approvalReadError) {
    return NextResponse.json({ ok: false, reason: "approval-read-failed" }, { status: 500 });
  }

  let approval = ((approvalRows as ParentApprovalRow[] | null) ?? [])[0] ?? null;
  let didCreateApprovalRequest = false;

  if (!approval) {
    const { error: insertApprovalError } = await adminSupabase
      .from("parent_approval_requests")
      .insert({
        profile_id: user.id,
        status: "pending",
      });

    if (insertApprovalError) {
      return NextResponse.json({ ok: false, reason: "approval-create-failed" }, { status: 500 });
    }
    didCreateApprovalRequest = true;

    const { data: createdApprovalRows, error: createdApprovalReadError } = await adminSupabase
      .from("parent_approval_requests")
      .select("id, status")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (createdApprovalReadError) {
      return NextResponse.json({ ok: false, reason: "approval-read-failed" }, { status: 500 });
    }

    approval = ((createdApprovalRows as ParentApprovalRow[] | null) ?? [])[0] ?? null;
  }

  const status = deriveParentApprovalStatus({
    membershipStatus: membership.approval_status,
    requestStatus: approval?.status ?? null,
  });

  const { data: roleRows, error: roleReadError } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  if (roleReadError) {
    return NextResponse.json({ ok: false, reason: "role-read-failed" }, { status: 500 });
  }

  const platformRole = ((profileRow as { platform_role: string | null } | null)?.platform_role ?? null);
  const schoolRoles = ((roleRows as MembershipRoleRow[] | null) ?? []).map((row) => row.school_role);
  const dashboardPath = resolveDashboardPath({
    platformRole,
    schoolRoles,
  });

  if (didCreateApprovalRequest) {
    await sendParentReviewEmailIfPossible({
      email,
      fullName,
      locale,
      requestOrigin: request.url,
    });
  }

  if (status === "rejected") {
    // Rejected parent accounts are fully removed from app data and auth.
    await adminSupabase.from("parent_approval_requests").delete().eq("profile_id", user.id);
    await adminSupabase.from("school_memberships").delete().eq("profile_id", user.id).eq("school_role", "parent");
    await adminSupabase.from("profiles").delete().eq("id", user.id);
    await adminSupabase.auth.admin.deleteUser(user.id);

    return NextResponse.json({ ok: false, reason: "account-removed" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    status,
    platformRole,
    schoolRoles,
    dashboardPath,
  });
}
