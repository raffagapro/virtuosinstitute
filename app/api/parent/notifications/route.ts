import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * GET /api/parent/notifications
 * Returns the authenticated parent's notification deliveries with campaign details.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser(accessToken);
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  // Verify parent role.
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles = ((memberships as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );

  if (!roles.includes("parent")) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Fetch deliveries with campaign details, newest first.
  const { data: deliveries, error: fetchErr } = await adminSupabase
    .from("notification_deliveries")
    .select(
      "id, in_app_status, email_status, delivered_at, read_at, notification_campaigns(id, title, body, subject, launched_at, scheduled_for, delivery_mode)"
    )
    .eq("profile_id", userData.user.id)
    .neq("in_app_status", "hidden")
    .order("delivered_at", { ascending: false })
    .limit(50);

  if (fetchErr) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deliveries: deliveries ?? [] });
}
