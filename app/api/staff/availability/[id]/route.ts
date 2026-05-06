import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const AVAILABILITY_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * DELETE /api/staff/availability/[id]
 * Deletes an availability rule. Only the calendar owner (or school_owner) may delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: ruleId } = await params;

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
  if (!roles.some((r) => AVAILABILITY_MANAGER_ROLES.includes(r))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Fetch the rule to verify the actor owns its calendar.
  const { data: rule } = await adminSupabase
    .from("availability_rules")
    .select("id, calendar_id, calendars(calendar_type)")
    .eq("id", ruleId)
    .single();

  if (!rule) {
    return NextResponse.json({ ok: false, reason: "not-found" }, { status: 404 });
  }

  const ROLE_CALENDAR_MAP: Record<string, string> = {
    coordination: "coordination_appointments",
    direction: "direction_appointments",
    clerk: "clerk_appointments",
  };

  const isSchoolOwner = roles.includes("school_owner");
  if (!isSchoolOwner) {
    const ruleCalType = ((rule as unknown as { calendars: { calendar_type: string } | null }).calendars)
      ?.calendar_type;
    const ownedTypes = roles.map((r) => ROLE_CALENDAR_MAP[r]).filter(Boolean);
    if (!ruleCalType || !ownedTypes.includes(ruleCalType)) {
      return NextResponse.json({ ok: false, reason: "calendar-access-denied" }, { status: 403 });
    }
  }

  const { error: deleteErr } = await adminSupabase
    .from("availability_rules")
    .delete()
    .eq("id", ruleId);

  if (deleteErr) {
    return NextResponse.json({ ok: false, reason: "delete-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
