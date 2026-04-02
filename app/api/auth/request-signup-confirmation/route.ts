import { NextResponse } from "next/server";
import { defaultLocale, resolveLocale, type Locale } from "@/lib/i18n";
import { isEmailAuthEnabled } from "@/lib/auth-flags";
import { resolveGeneratedAuthLink } from "@/lib/auth-email-links";
import { sendInviteEmail, InviteMailerConfigError } from "@/lib/invite-mailer";
import { buildSignupConfirmationEmail } from "@/lib/invite-templates/signup-confirmation";
import { getSupabaseAdminClient } from "@/lib/supabase";

interface RequestSignupConfirmationPayload {
  email?: string;
  locale?: string;
}

function resolveRequestOrigin(request: Request) {
  return new URL(request.url).origin;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resolvePreferredLocale(locale: string | null | undefined): Locale {
  return resolveLocale(locale ?? defaultLocale);
}

export async function POST(request: Request) {
  if (!isEmailAuthEnabled()) {
    return NextResponse.json({ ok: false, reason: "email-auth-disabled" }, { status: 404 });
  }

  const payload = (await request.json()) as RequestSignupConfirmationPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: true });
  }

  let adminSupabase: any;
  try {
    adminSupabase = getSupabaseAdminClient() as any;
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const { data: profileRow } = await adminSupabase
    .from("profiles")
    .select("full_name, preferred_locale")
    .eq("email", email)
    .maybeSingle();

  const generateLinkResult = await adminSupabase.auth.admin.generateLink({
    type: "signup",
    email,
    options: {
      redirectTo: `${resolveRequestOrigin(request)}/auth/callback`,
    },
  });

  if (generateLinkResult.error) {
    console.warn("Signup confirmation generateLink failed.", generateLinkResult.error.message);
    return NextResponse.json({ ok: true });
  }

  const resolvedLink = resolveGeneratedAuthLink({
    baseOrigin: resolveRequestOrigin(request),
    properties: generateLinkResult.data?.properties,
    nextPath: "/platfrom",
  });

  if (!resolvedLink) {
    return NextResponse.json({ ok: true });
  }

  const locale = resolvePreferredLocale(payload.locale ?? (profileRow as { preferred_locale?: string | null } | null)?.preferred_locale);
  const emailPayload = buildSignupConfirmationEmail({
    locale,
    fullName: (profileRow as { full_name?: string | null } | null)?.full_name,
    confirmationUrl: resolvedLink,
  });

  try {
    await sendInviteEmail({
      ...emailPayload,
      toEmail: email,
    });
  } catch (error) {
    if (error instanceof InviteMailerConfigError) {
      console.warn("Signup confirmation email skipped due to missing mailer config.");
    } else {
      console.error("Signup confirmation email send failed.", error);
    }
  }

  return NextResponse.json({ ok: true });
}
