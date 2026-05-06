import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const BLOCK_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk"];
const ROLE_CALENDAR_MAP: Record<string, string> = {
  coordination: "coordination_appointments",
  direction: "direction_appointments",
  clerk: "clerk_appointments",
};

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

async function resolveCalendarId(
  adminSupabase: ReturnType<typeof getSupabaseAdminClient>,
  profileId: string,
  requestedCalendarType?: string | null
): Promise<{ calendarId: string } | { error: string; status: number }> {
  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", profileId)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles: string[] = ((memberships as unknown as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );
  if (!roles.some((r) => BLOCK_MANAGER_ROLES.includes(r))) {
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

  if (!calendarType) return { error: "no-calendar-for-role", status: 403 };

  const { data: calRow } = await adminSupabase
    .from("calendars")
    .select("id")
    .eq("calendar_type", calendarType)
    .single();

  if (!calRow) return { error: "calendar-not-found", status: 404 };
  return { calendarId: (calRow as unknown as { id: string }).id };
}

/**
 * GET /api/staff/calendar-blocks
 * Returns calendar blocks for the staff member's calendar.
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
  const calResult = await resolveCalendarId(adminSupabase, userData.user.id, calTypeParam);
  if ("error" in calResult) {
    return NextResponse.json({ ok: false, reason: calResult.error }, { status: calResult.status });
  }

  const { data: blocks, error: blocksErr } = await adminSupabase
    .from("calendar_blocks")
    .select("id, starts_at, ends_at, reason, created_at")
    .eq("calendar_id", calResult.calendarId)
    .order("starts_at", { ascending: true });

  if (blocksErr) {
    return NextResponse.json({ ok: false, reason: "fetch-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, blocks: blocks ?? [] });
}

interface BlockPayload {
  startsAt: string;
  endsAt: string;
  reason?: string;
  calendarType?: string;
}

/**
 * POST /api/staff/calendar-blocks
 * Creates a calendar block for the staff member's calendar.
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

  let body: BlockPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const { startsAt, endsAt, reason, calendarType: calTypeParam } = body;
  if (!startsAt || !endsAt) {
    return NextResponse.json({ ok: false, reason: "missing-times" }, { status: 400 });
  }
  if (new Date(startsAt) >= new Date(endsAt)) {
    return NextResponse.json({ ok: false, reason: "invalid-range" }, { status: 400 });
  }

  const calResult = await resolveCalendarId(adminSupabase, userData.user.id, calTypeParam);
  if ("error" in calResult) {
    return NextResponse.json({ ok: false, reason: calResult.error }, { status: calResult.status });
  }

  const insertPayload: Record<string, unknown> = {
    calendar_id: calResult.calendarId,
    starts_at: startsAt,
    ends_at: endsAt,
    created_by_profile_id: userData.user.id,
  };
  if (reason?.trim()) insertPayload.reason = reason.trim();

  const { data: newBlock, error: insertErr } = await adminSupabase
    .from("calendar_blocks")
    .insert(insertPayload)
    .select("id, starts_at, ends_at, reason")
    .single();

  if (insertErr || !newBlock) {
    return NextResponse.json({ ok: false, reason: "create-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, block: newBlock }, { status: 201 });
}
