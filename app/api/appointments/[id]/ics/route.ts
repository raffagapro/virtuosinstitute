import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";
import { buildICS, buildGCalUrl } from "@/lib/calendar-slots";

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * GET /api/appointments/[id]/ics
 * Returns a downloadable .ics file for the appointment.
 * Accessible by the appointment requester (parent) or any staff member.
 * Query param: ?format=ics (default) | ?format=gcal (returns Google Calendar URL)
 */
export async function GET(
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

  const { data: appt } = await adminSupabase
    .from("appointments")
    .select("id, requester_profile_id, starts_at, ends_at, status, reason, calendars(calendar_type)")
    .eq("id", appointmentId)
    .single();

  if (!appt) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  const apptRow = appt as unknown as {
    id: string;
    requester_profile_id: string | null;
    starts_at: string;
    ends_at: string;
    status: string;
    reason: string | null;
    calendars: { calendar_type: string } | null;
  };

  // Allow requester or any approved staff to download.
  const isRequester = apptRow.requester_profile_id === userData.user.id;
  if (!isRequester) {
    const { data: memberships } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", userData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const roles = ((memberships as unknown as Array<{ school_role: string }> | null) ?? []).map(
      (m) => m.school_role
    );
    const isStaff = roles.some((r) =>
      ["school_owner", "direction", "coordination", "clerk", "superadmin"].includes(r)
    );
    if (!isStaff) {
      return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
    }
  }

  const calType = apptRow.calendars?.calendar_type ?? "appointment";
  const CALENDAR_LABELS: Record<string, string> = {
    coordination_appointments: "Coordinación",
    direction_appointments: "Dirección",
    clerk_appointments: "Secretaría",
  };
  const departmentLabel = CALENDAR_LABELS[calType] ?? "Cita";
  const title = `Cita — ${departmentLabel} | Virtuós Institute`;
  const description = apptRow.reason ?? "";
  const startsAt = new Date(apptRow.starts_at);
  const endsAt = new Date(apptRow.ends_at);

  const format = new URL(request.url).searchParams.get("format") ?? "ics";

  if (format === "gcal") {
    const gcalUrl = buildGCalUrl({
      title,
      startsAt,
      endsAt,
      description,
      location: "Virtuós Institute",
    });
    return NextResponse.json({ ok: true, url: gcalUrl });
  }

  const icsContent = buildICS({
    uid: appointmentId,
    title,
    startsAt,
    endsAt,
    description,
    organizer: "Virtuós Institute",
  });

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="cita-${appointmentId}.ics"`,
    },
  });
}
