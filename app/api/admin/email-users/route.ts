import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";
import { isEmailAuthEnabled } from "@/lib/auth-flags";
import { sendInviteEmail, InviteMailerConfigError } from "@/lib/invite-mailer";
import { buildParentReviewEmail } from "@/lib/invite-templates/parent-review";
import { type Locale } from "@/lib/i18n";

type MembershipRole = "school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest";
type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

interface CreateEmailUserPayload {
  email?: string;
  password?: string;
  fullName?: string;
  preferredLocale?: "es-MX" | "en-US";
  assignedRole?: MembershipRole;
  approvalStatus?: ApprovalStatus;
  createUnauthorizedOnly?: boolean;
}

const membershipRoles: MembershipRole[] = [
  "school_owner",
  "direction",
  "coordination",
  "teacher",
  "clerk",
  "parent",
  "student",
  "guest",
];

const approvalStatuses: ApprovalStatus[] = ["pending", "approved", "rejected", "suspended"];

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function isMembershipRole(value: unknown): value is MembershipRole {
  return typeof value === "string" && membershipRoles.includes(value as MembershipRole);
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" && approvalStatuses.includes(value as ApprovalStatus);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0] ?? "user";
  const normalized = localPart.replace(/[._-]+/g, " ").trim();
  if (!normalized) {
    return "Pending User";
  }

  return normalized
    .split(" ")
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function resolveCreateUserFailureReason(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("already") && normalized.includes("registered")) {
    return "email-already-exists";
  }

  if (normalized.includes("duplicate") && normalized.includes("email")) {
    return "email-already-exists";
  }

  return "auth-user-create-failed";
}

async function sendParentReviewEmailIfPossible(input: {
  email: string;
  fullName: string;
  locale: Locale;
  requestOrigin: string;
}) {
  const homeUrl = new URL("/", new URL(input.requestOrigin).origin).toString();
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

export async function POST(request: Request) {
  if (!isEmailAuthEnabled()) {
    return NextResponse.json({ ok: false, reason: "email-auth-disabled" }, { status: 404 });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const payload = (await request.json()) as CreateEmailUserPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const createUnauthorizedOnly = payload.createUnauthorizedOnly === true;
  const password = payload.password?.trim() ?? "";
  const fullName = (payload.fullName?.trim() || (createUnauthorizedOnly ? deriveNameFromEmail(email) : ""));
  const assignedRole = createUnauthorizedOnly ? "guest" : payload.assignedRole ?? "guest";
  const approvalStatus = createUnauthorizedOnly ? "pending" : payload.approvalStatus ?? "approved";

  if (!isValidEmail(email) || password.length < 8 || fullName.length < 2) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
  }

  if (!isMembershipRole(assignedRole) || !isApprovalStatus(approvalStatus)) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: actorData, error: actorError } = await serverSupabase.auth.getUser(accessToken);
  if (actorError || !actorData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
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

  const createUserResult = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      preferred_locale: payload.preferredLocale ?? "es-MX",
    },
  });

  if (createUserResult.error || !createUserResult.data.user) {
    const reason = resolveCreateUserFailureReason(createUserResult.error?.message);
    return NextResponse.json({ ok: false, reason }, { status: reason === "email-already-exists" ? 409 : 500 });
  }

  const createdUserId = createUserResult.data.user.id;

  const { error: profileUpsertError } = await adminSupabase.from("profiles").upsert(
    {
      id: createdUserId,
      full_name: fullName,
      email,
      preferred_locale: payload.preferredLocale ?? "es-MX",
    },
    { onConflict: "id" }
  );

  if (profileUpsertError) {
    return NextResponse.json({ ok: false, reason: "profile-upsert-failed" }, { status: 500 });
  }

  const { error: membershipUpsertError } = await adminSupabase.from("school_memberships").upsert(
    {
      profile_id: createdUserId,
      school_role: assignedRole,
      approval_status: approvalStatus,
      is_active: approvalStatus === "approved",
    },
    { onConflict: "profile_id,school_role" }
  );

  if (membershipUpsertError) {
    return NextResponse.json({ ok: false, reason: "membership-upsert-failed" }, { status: 500 });
  }

  if (createUnauthorizedOnly) {
    const { error: approvalInsertError } = await adminSupabase.from("parent_approval_requests").insert({
      profile_id: createdUserId,
      status: "pending",
    });

    if (approvalInsertError) {
      return NextResponse.json({ ok: false, reason: "approval-create-failed" }, { status: 500 });
    }

    await sendParentReviewEmailIfPossible({
      email,
      fullName,
      locale: payload.preferredLocale === "en-US" ? "en-US" : "es-MX",
      requestOrigin: request.url,
    });
  }

  return NextResponse.json({
    ok: true,
    userId: createdUserId,
    email,
    assignedRole,
    approvalStatus,
    isUnauthorized: createUnauthorizedOnly,
  });
}
