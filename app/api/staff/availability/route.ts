import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const AVAILABILITY_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk"];
const ROLE_CALENDAR_MAP: Record<string, string> = {
  coordination: "coordination_appointments",
  direction: "direction_appointments",
  clerk: "clerk_appointments",
};

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function resolveActorCalendar(
  adminSupabase: ReturnType<typeof getSupabaseAdminClient>,
  profileId: string,
  requestedCalendarType?: string | null
): Promise<{ calendarId: string; calendarType: string } | { error: string; status: number }> {
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles: string[] = ((memberships as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );
  if (!roles.some((r) => AVAILABILITY_MANAGER_ROLES.includes(r))) {
    return { error: "forbidden", status: 403 };
  }

  const isSchoolOwner = roles.includes("school_owner");
  let calendarType: string | undefined;

  if (isSchoolOwner && requestedCalendarType) {
    calendarType = requestedCalendarType;
  } else if (!isSchoolOwner) {
    const ownedTypes = roles.map((r) => ROLE_CALENDAR_MAP[r]).filter(Boolean);
    calendarType = requestedCalendarType
      ? ownedTypes.find((t) => t === requestedCalendarType)
      : ownedTypes[0];
  }

  if (!calendarType) {
    return { error: "no-calendar-for-role", status: 403 };
  }

  const { data: calRow } = await adminSupabase
    .from("calendars")
    .select("id")
    .eq("calendar_type", calendarType)
    .eq("is_active", true)
    .single();

  if (!calRow) {
    return { error: "calendar-not-found", status: 404 };
  }

  return { calendarId: (calRow as { id: string }).id, calendarType };
}

/**
 * GET /api/staff/availability
 * Returns availability rules for the authenticated staff member's calendar.
 * Query param: calendarType (required for school_owner to disambiguate).
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

  const calTypeParam = new URL(request.url).searchParams.get("calendarType");
  const calResult = await resolveActorCalendar(adminSupabase, userData.user.id, calTypeParam);
  if ("error" in calResult) {
    return NextResponse.json({ ok: false, reason: calResult.error }, { status: calResult.status });
  }

  const { data: rules, error: rulesErr } = await adminSupabase
    .from("availability_rules")
    .select("id, weekday, start_time, end_time, slot_minutes, effective_from, effective_to, created_at")
    .eq("calendar_id", calResult.calendarId)
    .order("weekday", { ascending: true });

  if (rulesErr) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    calendarId: calResult.calendarId,
    calendarType: calResult.calendarType,
    rules: rules ?? [],
  });
}

interface AvailabilityRulePayload {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  calendarType?: string;
}

/**
 * POST /api/staff/availability
 * Creates a new availability rule for the authenticated staff member's calendar.
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

  let body: AvailabilityRulePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const { weekday, startTime, endTime, slotMinutes, effectiveFrom, effectiveTo, calendarType: calTypeParam } = body;

  if (weekday === undefined || weekday < 0 || weekday > 6) {
    return NextResponse.json({ ok: false, reason: "invalid-weekday" }, { status: 400 });
  }
  if (!startTime || !endTime) {
    return NextResponse.json({ ok: false, reason: "missing-times" }, { status: 400 });
  }
  if (!([30, 60] as number[]).includes(slotMinutes)) {
    return NextResponse.json({ ok: false, reason: "invalid-slot-minutes", allowed: [30, 60] }, { status: 400 });
  }
  if (!effectiveFrom) {
    return NextResponse.json({ ok: false, reason: "missing-effective-from" }, { status: 400 });
  }

  const calResult = await resolveActorCalendar(adminSupabase, userData.user.id, calTypeParam);
  if ("error" in calResult) {
    return NextResponse.json({ ok: false, reason: calResult.error }, { status: calResult.status });
  }

  const insertPayload: Record<string, unknown> = {
    calendar_id: calResult.calendarId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    slot_minutes: slotMinutes,
    effective_from: effectiveFrom,
    created_by_profile_id: userData.user.id,
  };
  if (effectiveTo) insertPayload.effective_to = effectiveTo;

  const { data: newRule, error: insertErr } = await adminSupabase
    .from("availability_rules")
    .insert(insertPayload)
    .select("id, weekday, start_time, end_time, slot_minutes, effective_from, effective_to")
    .single();

  if (insertErr || !newRule) {
    return NextResponse.json({ ok: false, reason: "create-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, rule: newRule }, { status: 201 });
}
