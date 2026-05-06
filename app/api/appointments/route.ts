import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const PARENT_BOOKABLE = ["coordination_appointments", "direction_appointments"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

interface CreateAppointmentPayload {
  calendarType: string;
  startsAt: string;
  endsAt: string;
  requesterNote?: string;
  studentId?: string | null;
}

/**
 * POST /api/appointments
 * Parent creates an appointment request for coordination or direction.
 * The slot is immediately "held" by creating an appointment with status "requested".
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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

  // Must be an approved parent.
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", userData.user.id)
    .eq("school_role", "parent")
    .eq("approval_status", "approved")
    .eq("is_active", true);

  if (!memberships?.length) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: CreateAppointmentPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const { calendarType, startsAt, endsAt, requesterNote, studentId } = body;

  if (!calendarType || !PARENT_BOOKABLE.includes(calendarType)) {
    return NextResponse.json({ ok: false, reason: "invalid-calendar-type" }, { status: 400 });
  }
  if (!startsAt || !endsAt) {
    return NextResponse.json({ ok: false, reason: "missing-slot-times" }, { status: 400 });
  }
  if (new Date(startsAt) >= new Date(endsAt)) {
    return NextResponse.json({ ok: false, reason: "invalid-slot-range" }, { status: 400 });
  }
  if (new Date(startsAt) < new Date()) {
    return NextResponse.json({ ok: false, reason: "slot-in-past" }, { status: 400 });
  }

  // Resolve the calendar id.
  const { data: calendarRows } = await adminSupabase
    .from("calendars")
    .select("id")
    .eq("calendar_type", calendarType)
    .eq("is_active", true)
    .limit(1);

  if (!calendarRows?.length) {
    return NextResponse.json({ ok: false, reason: "calendar-not-found" }, { status: 404 });
  }
  const calendarId: string = (calendarRows[0] as unknown as { id: string }).id;

  // Verify the slot is still available (no active appointment overlaps).
  const { data: conflicts } = await adminSupabase
    .from("appointments")
    .select("id")
    .eq("calendar_id", calendarId)
    .in("status", ["requested", "confirmed"])
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (conflicts?.length) {
    return NextResponse.json({ ok: false, reason: "slot-unavailable" }, { status: 409 });
  }

  // Verify the slot is not covered by a calendar block.
  const { data: blockConflicts } = await adminSupabase
    .from("calendar_blocks")
    .select("id")
    .eq("calendar_id", calendarId)
    .lt("starts_at", endsAt)
    .gt("ends_at", startsAt)
    .limit(1);

  if (blockConflicts?.length) {
    return NextResponse.json({ ok: false, reason: "slot-blocked" }, { status: 409 });
  }

  // Optionally verify the student belongs to this parent.
  if (studentId) {
    const { data: guardianRows } = await adminSupabase
      .from("student_guardians")
      .select("student_id")
      .eq("parent_profile_id", userData.user.id)
      .eq("student_id", studentId)
      .limit(1);

    if (!guardianRows?.length) {
      return NextResponse.json({ ok: false, reason: "student-not-linked" }, { status: 403 });
    }
  }

  const insertPayload: Record<string, unknown> = {
    calendar_id: calendarId,
    requester_profile_id: userData.user.id,
    status: "requested",
    requested_by_role: "parent",
    starts_at: startsAt,
    ends_at: endsAt,
  };
  if (requesterNote) insertPayload.reason = requesterNote;
  if (studentId) insertPayload.student_id = studentId;

  const { data: newAppt, error: insertErr } = await adminSupabase
    .from("appointments")
    .insert(insertPayload)
    .select("id, starts_at, ends_at, status")
    .single();

  if (insertErr || !newAppt) {
    return NextResponse.json({ ok: false, reason: "create-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appointment: newAppt }, { status: 201 });
}
