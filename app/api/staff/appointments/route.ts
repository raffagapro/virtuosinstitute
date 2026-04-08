import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const MANAGED_ROLES = ["school_owner", "direction", "coordination", "clerk", "superadmin"];
const ROLE_CALENDAR_MAP: Record<string, string> = {
  coordination: "coordination_appointments",
  direction: "direction_appointments",
  clerk: "clerk_appointments",
};

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * GET /api/staff/appointments
 * Returns the appointment queue for the requesting staff member's calendar(s).
 *
 * Query params:
 *   status        – filter by status (optional, comma-separated)
 *   calendarType  – filter to a specific calendar (optional)
 *   from          – ISO date string (optional)
 *   to            – ISO date string (optional)
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

  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles: string[] = ((memberships as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );
  if (!roles.some((r) => MANAGED_ROLES.includes(r))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const isSchoolOwner = roles.includes("school_owner");
  const isSuperadmin = roles.includes("superadmin");

  let calendarTypes: string[];
  if (isSchoolOwner || isSuperadmin) {
    calendarTypes = ["coordination_appointments", "direction_appointments", "clerk_appointments"];
  } else {
    calendarTypes = roles.map((r) => ROLE_CALENDAR_MAP[r]).filter(Boolean);
  }

  if (!calendarTypes.length) {
    return NextResponse.json({ ok: false, reason: "no-calendar-for-role" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");
  const calTypeFilter = searchParams.get("calendarType");
  const fromFilter = searchParams.get("from");
  const toFilter = searchParams.get("to");

  const effectiveCalTypes = calTypeFilter
    ? calendarTypes.filter((t) => t === calTypeFilter)
    : calendarTypes;

  if (!effectiveCalTypes.length) {
    return NextResponse.json({ ok: false, reason: "calendar-access-denied" }, { status: 403 });
  }

  // Fetch calendar ids.
  const { data: calRows } = await adminSupabase
    .from("calendars")
    .select("id, calendar_type")
    .in("calendar_type", effectiveCalTypes)
    .eq("is_active", true);

  const calendarIds = ((calRows ?? []) as Array<{ id: string }>).map((c) => c.id);
  if (!calendarIds.length) {
    return NextResponse.json({ ok: true, appointments: [] });
  }

  let query = adminSupabase
    .from("appointments")
    .select(
      `id, calendar_id, status, requested_by_role, reason, starts_at, ends_at,
       student_id, created_at,
       requester_profile:profiles!requester_profile_id(id, full_name, email),
       calendars(calendar_type)`
    )
    .in("calendar_id", calendarIds)
    .order("starts_at", { ascending: true });

  if (statusFilter) {
    const statuses = statusFilter.split(",").map((s) => s.trim());
    query = query.in("status", statuses);
  }
  if (fromFilter) query = query.gte("starts_at", fromFilter);
  if (toFilter) query = query.lte("starts_at", toFilter);

  const { data: appointments, error: apptErr } = await query;
  if (apptErr) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, appointments: appointments ?? [] });
}
