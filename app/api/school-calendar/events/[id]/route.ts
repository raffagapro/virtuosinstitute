import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const WRITE_ROLES = ["school_owner", "direction", "coordination"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function assertWriteAccess(
  request: NextRequest,
  adminSupabase: ReturnType<typeof getSupabaseAdminClient>
): Promise<{ userId: string } | NextResponse> {
  const accessToken = getBearerToken(request);
  if (!accessToken) {
    return NextResponse.json({ ok: false, reason: "missing-token" }, { status: 401 });
  }

  const serverSupabase = getSupabaseServerClient();
  const { data: userData, error: userErr } = await serverSupabase.auth.getUser(accessToken);
  if (userErr || !userData.user) {
    return NextResponse.json({ ok: false, reason: "invalid-session" }, { status: 401 });
  }

  // Check platform superadmin first.
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const isSuperadmin =
    (profile as unknown as { platform_role: string | null } | null)?.platform_role === "superadmin";

  if (!isSuperadmin) {
    const { data: memberships } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", userData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const roles: string[] = (
      (memberships as unknown as Array<{ school_role: string }> | null) ?? []
    ).map((m) => m.school_role);

    if (!roles.some((r) => WRITE_ROLES.includes(r))) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  }

  return { userId: userData.user.id };
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PATCH /api/school-calendar/events/[id]
 * Updates an existing school event.
 */
export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const authResult = await assertWriteAccess(request, adminSupabase);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;

  // Verify the event exists and is a school_event (not a birthday).
  const { data: existing } = await adminSupabase
    .from("calendar_events")
    .select("id, event_type")
    .eq("id", id)
    .eq("event_type", "school_event")
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  let body: { title?: string; description?: string; starts_at?: string; ends_at?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() ?? null;
  if (body.starts_at !== undefined) {
    if (isNaN(new Date(body.starts_at).getTime())) {
      return NextResponse.json({ ok: false, reason: "invalid-starts_at" }, { status: 400 });
    }
    updates.starts_at = body.starts_at;
  }
  if (body.ends_at !== undefined) {
    if (isNaN(new Date(body.ends_at).getTime())) {
      return NextResponse.json({ ok: false, reason: "invalid-ends_at" }, { status: 400 });
    }
    updates.ends_at = body.ends_at;
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json({ ok: false, reason: "no-fields" }, { status: 400 });
  }

  const { data: updated, error: updateErr } = await adminSupabase
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select("id, title, description, event_type, starts_at, ends_at")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: updated });
}

/**
 * DELETE /api/school-calendar/events/[id]
 * Deletes a school event.
 */
export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const authResult = await assertWriteAccess(request, adminSupabase);
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await context.params;

  const { data: existing } = await adminSupabase
    .from("calendar_events")
    .select("id, event_type")
    .eq("id", id)
    .eq("event_type", "school_event")
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  const { error: deleteErr } = await adminSupabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    return NextResponse.json({ ok: false, reason: "delete-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
