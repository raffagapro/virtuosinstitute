import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const CALENDAR_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk", "superadmin"];

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
 * GET /api/staff/calendar-info
 * Returns the authenticated staff user's role, owned calendar type, and calendar id.
 * Superadmin receives all three department calendars for read-only purposes.
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

  const roles: string[] = ((memberships as unknown as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );

  if (!roles.some((r) => CALENDAR_MANAGER_ROLES.includes(r))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  const isSchoolOwner = roles.includes("school_owner");
  const isSuperadmin = roles.includes("superadmin");

  // Determine which calendar types to return.
  let calendarTypes: string[];
  if (isSchoolOwner || isSuperadmin) {
    calendarTypes = ["coordination_appointments", "direction_appointments", "clerk_appointments"];
  } else {
    const ownedTypes = roles.map((r) => ROLE_CALENDAR_MAP[r]).filter(Boolean);
    calendarTypes = [...new Set(ownedTypes)];
  }

  if (!calendarTypes.length) {
    // Teacher or unrecognized role — no calendar access.
    return NextResponse.json({ ok: false, reason: "no-calendar-for-role" }, { status: 403 });
  }

  const { data: existingCalendars } = await adminSupabase
    .from("calendars")
    .select("id, calendar_type, title")
    .in("calendar_type", calendarTypes)
    .eq("is_active", true);

  const existing = (existingCalendars ?? []) as unknown as Array<{
    id: string;
    calendar_type: string;
    title: string;
  }>;

  // Auto-seed any missing calendar rows (runs once per type, idempotent).
  const CALENDAR_TITLES: Record<string, string> = {
    coordination_appointments: "Coordinación",
    direction_appointments: "Dirección",
    clerk_appointments: "Administrativo",
  };

  const existingTypes = new Set(existing.map((c) => c.calendar_type));
  const missingTypes = calendarTypes.filter((t) => !existingTypes.has(t));

  let calendars = existing;
  if (missingTypes.length > 0) {
    await adminSupabase
      .from("calendars")
      .insert(
        missingTypes.map((t) => ({
          calendar_type: t,
          title: CALENDAR_TITLES[t] ?? t,
          is_active: true,
        })) as unknown as Array<Record<string, unknown>>
      );

    const { data: allCalendars } = await adminSupabase
      .from("calendars")
      .select("id, calendar_type, title")
      .in("calendar_type", calendarTypes)
      .eq("is_active", true);

    calendars = (allCalendars ?? []) as unknown as Array<{
      id: string;
      calendar_type: string;
      title: string;
    }>;
  }

  return NextResponse.json({
    ok: true,
    roles,
    isReadOnly: isSuperadmin && !isSchoolOwner,
    calendars,
  });
}
