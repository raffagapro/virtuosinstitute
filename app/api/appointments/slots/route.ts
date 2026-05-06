import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";
import { computeSlots, AvailabilityRule, AppointmentBrief, CalendarBlock } from "@/lib/calendar-slots";

/** Calendar types parents can book via this endpoint. Clerk is guest-only. */
const BOOKABLE_CALENDAR_TYPES = ["coordination_appointments", "direction_appointments"] as const;
type BookableCalendarType = (typeof BOOKABLE_CALENDAR_TYPES)[number];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * GET /api/appointments/slots
 * Returns computed time slots for a department calendar visible to parents.
 * Query params:
 *   calendarType  – "coordination_appointments" | "direction_appointments"
 *   from          – YYYY-MM-DD  (start of range, defaults to today)
 *   to            – YYYY-MM-DD  (end of range, defaults to today + 14 days)
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

  // Verify approved parent or any active staff membership.
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role, approval_status, is_active")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true);

  const roles: string[] = ((memberships as unknown as Array<{ school_role: string; approval_status: string }> | null) ?? [])
    .filter((m) => m.approval_status === "approved")
    .map((m) => m.school_role);

  const isParent = roles.includes("parent");
  const isStaff = roles.some((r) =>
    ["school_owner", "direction", "coordination", "clerk", "teacher"].includes(r)
  );
  const isSuperadmin = roles.includes("superadmin");

  if (!isParent && !isStaff && !isSuperadmin) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const calendarType = searchParams.get("calendarType") as BookableCalendarType | null;

  if (!calendarType || !BOOKABLE_CALENDAR_TYPES.includes(calendarType)) {
    return NextResponse.json(
      { ok: false, reason: "invalid-calendar-type", allowed: BOOKABLE_CALENDAR_TYPES },
      { status: 400 }
    );
  }

  const today = new Date();
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const fromDate = fromParam ? new Date(fromParam + "T00:00:00") : today;
  const defaultTo = new Date(today);
  defaultTo.setDate(defaultTo.getDate() + 14);
  const toDate = toParam ? new Date(toParam + "T23:59:59") : defaultTo;

  // Fetch the calendar record.
  const { data: calendarRows, error: calErr } = await adminSupabase
    .from("calendars")
    .select("id")
    .eq("calendar_type", calendarType)
    .eq("is_active", true)
    .limit(1);

  if (calErr || !calendarRows?.length) {
    return NextResponse.json({ ok: false, reason: "calendar-not-found" }, { status: 404 });
  }
  const calendarId: string = (calendarRows[0] as unknown as { id: string }).id;

  const fromISO = fromDate.toISOString();
  const toISO = toDate.toISOString();

  // Fetch availability rules, existing appointments, and calendar blocks in parallel.
  const [rulesResult, appointmentsResult, blocksResult] = await Promise.all([
    adminSupabase
      .from("availability_rules")
      .select("id, weekday, start_time, end_time, slot_minutes, effective_from, effective_to")
      .eq("calendar_id", calendarId),
    adminSupabase
      .from("appointments")
      .select("id, starts_at, ends_at, status")
      .eq("calendar_id", calendarId)
      .in("status", ["requested", "confirmed"])
      .gte("starts_at", fromISO)
      .lte("ends_at", toISO),
    adminSupabase
      .from("calendar_blocks")
      .select("starts_at, ends_at")
      .eq("calendar_id", calendarId)
      .gte("starts_at", fromISO)
      .lte("ends_at", toISO),
  ]);

  if (rulesResult.error) {
    return NextResponse.json({ ok: false, reason: "rules-fetch-failed" }, { status: 500 });
  }

  const rules = (rulesResult.data ?? []) as unknown as AvailabilityRule[];
  const appointments = (appointmentsResult.data ?? []) as unknown as AppointmentBrief[];
  const blocks = (blocksResult.data ?? []) as unknown as CalendarBlock[];

  const slots = computeSlots(rules, fromDate, toDate, appointments, blocks);

  return NextResponse.json({
    ok: true,
    calendarType,
    calendarId,
    slots: slots.map((s) => ({
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      status: s.status,
      appointmentId: s.appointmentId ?? null,
    })),
  });
}
