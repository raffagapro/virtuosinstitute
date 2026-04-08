import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

/** Roles allowed to manage appointments (approve/reject/cancel/complete). */
const APPOINTMENT_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * PATCH /api/appointments/[id]
 * Staff member approves, rejects, cancels, completes, or marks no-show.
 *
 * Body: { action: "approve" | "reject" | "cancel" | "complete" | "no_show" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: appointmentId } = await params;

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

  // Verify the user has an appointment-management role.
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles: string[] = (
    (memberships as Array<{ school_role: string }> | null) ?? []
  ).map((m) => m.school_role);

  const canManage = roles.some((r) => APPOINTMENT_MANAGER_ROLES.includes(r));
  if (!canManage) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: { action: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const VALID_ACTIONS = ["approve", "reject", "cancel", "complete", "no_show"];
  if (!body.action || !VALID_ACTIONS.includes(body.action)) {
    return NextResponse.json(
      { ok: false, reason: "invalid-action", allowed: VALID_ACTIONS },
      { status: 400 }
    );
  }

  // Fetch the appointment to verify it exists and the actor can manage this calendar.
  const { data: appt, error: apptErr } = await adminSupabase
    .from("appointments")
    .select("id, calendar_id, status, starts_at, ends_at")
    .eq("id", appointmentId)
    .single();

  if (apptErr || !appt) {
    return NextResponse.json({ ok: false, reason: "appointment-not-found" }, { status: 404 });
  }

  const { calendar_id, status: currentStatus } = appt as {
    id: string;
    calendar_id: string;
    status: string;
    starts_at: string;
    ends_at: string;
  };

  // Map role → owned calendar type; school_owner can manage any.
  const ROLE_CALENDAR_MAP: Record<string, string> = {
    coordination: "coordination_appointments",
    direction: "direction_appointments",
    clerk: "clerk_appointments",
  };

  const isSchoolOwner = roles.includes("school_owner");
  if (!isSchoolOwner) {
    const { data: calRow } = await adminSupabase
      .from("calendars")
      .select("calendar_type")
      .eq("id", calendar_id)
      .single();

    const calType = (calRow as { calendar_type: string } | null)?.calendar_type;
    const actorOwnedCalType = roles.map((r) => ROLE_CALENDAR_MAP[r]).find(Boolean);

    if (!calType || !actorOwnedCalType || calType !== actorOwnedCalType) {
      return NextResponse.json({ ok: false, reason: "calendar-access-denied" }, { status: 403 });
    }
  }

  const STATUS_TRANSITIONS: Record<string, Record<string, string>> = {
    approve: { requested: "confirmed" },
    reject: { requested: "canceled" },
    cancel: { requested: "canceled", confirmed: "canceled" },
    complete: { confirmed: "completed" },
    no_show: { confirmed: "no_show" },
  };

  const nextStatus = STATUS_TRANSITIONS[body.action]?.[currentStatus];
  if (!nextStatus) {
    return NextResponse.json(
      { ok: false, reason: "invalid-transition", currentStatus },
      { status: 422 }
    );
  }

  const { data: updated, error: updateErr } = await adminSupabase
    .from("appointments")
    .update({ status: nextStatus })
    .eq("id", appointmentId)
    .select("id, status")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ ok: false, reason: "update-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appointment: updated });
}
