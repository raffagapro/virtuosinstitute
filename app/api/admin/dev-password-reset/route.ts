import { NextResponse } from "next/server";
import { isEmailAuthEnabled } from "@/lib/auth-flags";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase";

interface PasswordResetPayload {
  email?: string;
  password?: string;
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!isEmailAuthEnabled()) {
    return NextResponse.json({ ok: false, reason: "email-auth-disabled" }, { status: 404 });
  }

  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const payload = (await request.json()) as PasswordResetPayload;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const password = payload.password?.trim() ?? "";

  if (!isValidEmail(email) || password.length < 8) {
    return NextResponse.json({ ok: false, reason: "invalid-input" }, { status: 400 });
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
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  if (targetProfileError) {
    return NextResponse.json({ ok: false, reason: "profile-read-failed" }, { status: 500 });
  }

  if (!targetProfile?.id) {
    return NextResponse.json({ ok: false, reason: "email-not-found" }, { status: 404 });
  }

  const updateUserResult = await adminSupabase.auth.admin.updateUserById(targetProfile.id, {
    password,
  });

  if (updateUserResult.error) {
    return NextResponse.json({ ok: false, reason: "auth-user-update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
