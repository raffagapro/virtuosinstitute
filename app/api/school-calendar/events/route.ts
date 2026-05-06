import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";
import { sendInviteEmail } from "@/lib/invite-mailer";

// Roles that can write school events (school_memberships.school_role).
const WRITE_ROLES = ["school_owner", "direction", "coordination"];
// Staff membership roles that can view school events.
const STAFF_ROLES = ["school_owner", "direction", "coordination", "teacher", "clerk"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

/**
 * Auto-seeds the school_events calendar row and returns its id.
 * Idempotent — only inserts if it doesn't exist. Single-school, no school_id.
 */
async function ensureSchoolCalendar(
  adminSupabase: ReturnType<typeof getSupabaseAdminClient>
): Promise<string> {
  const { data: existing } = await adminSupabase
    .from("calendars")
    .select("id")
    .eq("calendar_type", "school_events")
    .eq("is_active", true)
    .maybeSingle();

  if (existing) return (existing as unknown as { id: string }).id;

  const { data: inserted, error: calendarErr } = await adminSupabase
    .from("calendars")
    .insert({ calendar_type: "school_events", title: "Calendario Escolar", is_active: true } as unknown as never)
    .select("id")
    .single();

  if (!inserted) {
    throw new Error(`Failed to seed school calendar: ${calendarErr?.message ?? "unknown"}`);
  }
  return (inserted as unknown as { id: string }).id;
}

/**
 * Compute birthday events for students and staff that fall within [from, to].
 * Birthdays are derived from date_of_birth — not stored in calendar_events.
 */
function computeBirthdayEvents(
  people: Array<{ id: string; name: string; dob: string; type: "student" | "staff"; role: string }>,
  from: Date,
  to: Date
): Array<{
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string;
  ends_at: string;
  is_birthday: true;
  role: string;
}> {
  const results: ReturnType<typeof computeBirthdayEvents> = [];

  const fromYear = from.getFullYear();
  const toYear = to.getFullYear();

  for (const person of people) {
    // date_of_birth is "YYYY-MM-DD"
    const parts = person.dob.split("-");
    if (parts.length < 3) continue;
    const month = parseInt(parts[1], 10) - 1; // 0-based
    const day = parseInt(parts[2], 10);

    for (let year = fromYear; year <= toYear; year++) {
      const birthdayStart = new Date(year, month, day, 0, 0, 0);
      const birthdayEnd = new Date(year, month, day, 23, 59, 59);

      if (birthdayStart >= from && birthdayStart <= to) {
        results.push({
          id: `birthday-${person.type}-${person.id}-${year}`,
          title: person.name,
          description: null,
          event_type: person.type === "student" ? "student_birthday" : "staff_birthday",
          starts_at: birthdayStart.toISOString(),
          ends_at: birthdayEnd.toISOString(),
          is_birthday: true,
          role: person.role,
        });
      }
    }
  }

  return results;
}

/**
 * GET /api/school-calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Returns school events + auto-generated birthday events.
 * Staff see all types; parents see only school_event type.
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

  // Determine viewer's roles and school — superadmin check first.
  const { data: viewerProfile, error: profileErr } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const isSuperadmin =
    (viewerProfile as unknown as { platform_role: string | null } | null)?.platform_role === "superadmin";

  let roles: string[] = [];

  if (isSuperadmin) {
    roles = ["school_owner"]; // grant full staff rights
  } else {
    const { data: memberships } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", userData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const membershipRows = (memberships as unknown as Array<{ school_role: string }> | null) ?? [];
    roles = membershipRows.map((m) => m.school_role);
  }

  const isStaff = isSuperadmin || roles.some((r) => STAFF_ROLES.includes(r));
  const isParent = roles.includes("parent");
  const canWrite = isSuperadmin || roles.some((r) => WRITE_ROLES.includes(r));

  if (!isStaff && !isParent) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Parse date range.
  const url = new URL(request.url);
  const fromParam = url.searchParams.get("from");
  const toParam = url.searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json({ ok: false, reason: "missing-range" }, { status: 400 });
  }

  const from = new Date(`${fromParam}T00:00:00`);
  const to = new Date(`${toParam}T23:59:59`);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ ok: false, reason: "invalid-range" }, { status: 400 });
  }

  let calendarId: string;
  try {
    calendarId = await ensureSchoolCalendar(adminSupabase);
  } catch (e) {
    console.error("[school-calendar GET] ensureSchoolCalendar failed:", e);
    return NextResponse.json({ ok: true, events: [], canWrite });
  }

  // Fetch school_events from calendar_events.
  const { data: dbEvents } = await adminSupabase
    .from("calendar_events")
    .select("id, title, description, event_type, starts_at, ends_at, created_by_profile_id")
    .eq("calendar_id", calendarId)
    .eq("event_type", "school_event")
    .lte("starts_at", to.toISOString())
    .gte("ends_at", from.toISOString())
    .order("starts_at", { ascending: true });

  const schoolEvents = (
    dbEvents as unknown as Array<{
      id: string;
      title: string;
      description: string | null;
      event_type: string;
      starts_at: string;
      ends_at: string;
      created_by_profile_id: string | null;
    }>
  ) ?? [];

  // Birthdays: all authenticated users (staff and parents) see student + staff birthdays.
  let birthdayEvents: ReturnType<typeof computeBirthdayEvents> = [];

  if (isStaff || isParent) {
    // Fetch active students with DOB.
    const { data: students } = await adminSupabase
      .from("students")
      .select("id, first_name, last_name, date_of_birth")
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .not("date_of_birth", "is", null);

    const studentPeople = (
      (students as unknown as Array<{ id: string; first_name: string; last_name: string; date_of_birth: string }> | null) ?? []
    ).map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      dob: s.date_of_birth,
      type: "student" as const,
      role: "student",
    }));

    // Fetch active staff memberships to capture profile_id → role mapping.
    const { data: staffMemberships } = await adminSupabase
      .from("school_memberships")
      .select("profile_id, school_role")
      .in("school_role", STAFF_ROLES)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const staffRoleMap = new Map(
      ((staffMemberships as unknown as Array<{ profile_id: string; school_role: string }> | null) ?? [])
        .map((m) => [m.profile_id, m.school_role])
    );

    // Fetch active staff profiles with DOB.
    const staffProfileIds = [...staffRoleMap.keys()];
    const staffPeople: Array<{ id: string; name: string; dob: string; type: "staff"; role: string }> = [];

    if (staffProfileIds.length > 0) {
      const { data: staffProfiles } = await adminSupabase
        .from("profiles")
        .select("id, full_name, date_of_birth")
        .not("date_of_birth", "is", null)
        .in("id", staffProfileIds);

      (staffProfiles as unknown as Array<{ id: string; full_name: string; date_of_birth: string }> | null)?.forEach((p) => {
        staffPeople.push({
          id: p.id,
          name: p.full_name,
          dob: p.date_of_birth,
          type: "staff",
          role: staffRoleMap.get(p.id) ?? "staff",
        });
      });
    }

    birthdayEvents = computeBirthdayEvents([...studentPeople, ...staffPeople], from, to);
  }

  const allEvents = [
    ...schoolEvents.map((e) => ({ ...e, is_birthday: false })),
    ...birthdayEvents,
  ].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  );

  return NextResponse.json({ ok: true, events: allEvents, canWrite });
}

/**
 * POST /api/school-calendar/events
 * Creates a new school event. Restricted to school_owner, direction, coordination.
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

  // Superadmin check first (same pattern as other admin routes).
  const { data: creatorProfile } = await adminSupabase
    .from("profiles")
    .select("platform_role")
    .eq("id", userData.user.id)
    .maybeSingle();

  const isSuperadmin =
    (creatorProfile as unknown as { platform_role: string | null } | null)?.platform_role === "superadmin";

  let roles: string[] = [];

  if (isSuperadmin) {
    roles = ["school_owner"];
  } else {
    const { data: memberships } = await adminSupabase
      .from("school_memberships")
      .select("school_role")
      .eq("profile_id", userData.user.id)
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const membershipRows = (memberships as unknown as Array<{ school_role: string }> | null) ?? [];
    roles = membershipRows.map((m) => m.school_role);
  }

  if (!isSuperadmin && !roles.some((r) => WRITE_ROLES.includes(r))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  let body: {
    title?: string;
    description?: string;
    starts_at?: string;
    ends_at?: string;
    notify_parents?: boolean;
    notify_day_of?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-body" }, { status: 400 });
  }

  const { title, description, starts_at, ends_at, notify_parents, notify_day_of } = body;

  if (!title?.trim() || !starts_at || !ends_at) {
    return NextResponse.json({ ok: false, reason: "missing-fields" }, { status: 400 });
  }

  if (isNaN(new Date(starts_at).getTime()) || isNaN(new Date(ends_at).getTime())) {
    return NextResponse.json({ ok: false, reason: "invalid-dates" }, { status: 400 });
  }

  let calendarId: string;
  try {
    calendarId = await ensureSchoolCalendar(adminSupabase);
  } catch (calErr) {
    console.error("[school-calendar/events POST] ensureSchoolCalendar failed:", calErr);
    return NextResponse.json({ ok: false, reason: "calendar-seed-failed", detail: String(calErr) }, { status: 500 });
  }

  const { data: inserted, error: insertErr } = await adminSupabase
    .from("calendar_events")
    .insert({
      calendar_id: calendarId,
      title: title.trim(),
      description: description?.trim() ?? null,
      event_type: "school_event",
      starts_at,
      ends_at,
      created_by_profile_id: userData.user.id,
    } as unknown as never)
    .select("id, title, description, event_type, starts_at, ends_at")
    .single();

  if (insertErr || !inserted) {
    console.error("[school-calendar/events POST] calendar_events insert failed:", insertErr);
    return NextResponse.json({ ok: false, reason: "insert-failed", detail: insertErr?.message }, { status: 500 });
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  if (notify_parents || notify_day_of) {
    // Fetch all active approved parents.
    const { data: parentMemberships } = await adminSupabase
      .from("school_memberships")
      .select("profile_id")
      .eq("school_role", "parent")
      .eq("is_active", true)
      .eq("approval_status", "approved");

    const parentProfileIds = ((parentMemberships as unknown as Array<{ profile_id: string }> | null) ?? []).map(
      (m) => m.profile_id
    );

    if (parentProfileIds.length > 0) {
      // Fetch parent profiles for email sending.
      const { data: parentProfiles } = await adminSupabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", parentProfileIds);

      const parents = (parentProfiles as unknown as Array<{ id: string; full_name: string; email: string | null }> | null) ?? [];

      const eventTitle = (inserted as unknown as { title: string }).title;
      const eventDescription = (inserted as unknown as { description: string | null }).description;

      if (notify_parents) {
        // Create immediate notification campaign.
        const { data: campaign } = await adminSupabase
          .from("notification_campaigns")
          .insert({
            title: eventTitle,
            subject: eventTitle,
            body: eventDescription ?? eventTitle,
            target_audience: "parents",
            delivery_mode: "immediate",
            status: "sending",
            send_email: true,
            send_in_app: true,
            created_by_profile_id: userData.user.id,
            launched_at: new Date().toISOString(),
          } as unknown as never)
          .select("id")
          .single();

        const campaignId = (campaign as unknown as { id: string } | null)?.id;

        if (campaignId) {
          // Seed delivery rows (in_app unread immediately).
          await adminSupabase
            .from("notification_deliveries")
            .insert(
              parentProfileIds.map((pid) => ({
                campaign_id: campaignId,
                profile_id: pid,
                email_status: "pending",
                in_app_status: "unread",
              })) as unknown as never[]
            );

          // Build email content.
          const [datePart] = (starts_at as string).split("T");
          const [yr, mo, dy] = datePart.split("-").map(Number);
          const dateLabel = new Date(yr, mo - 1, dy).toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const emailHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#003F60"><h2 style="margin-bottom:8px">${eventTitle}</h2><p><strong>Fecha:</strong> ${dateLabel}</p>${eventDescription ? `<p style="margin-top:12px">${eventDescription}</p>` : ""}</div>`;
          const emailText = `${eventTitle}\n\nFecha: ${dateLabel}${eventDescription ? `\n\n${eventDescription}` : ""}`;

          // Send emails and update delivery statuses.
          for (const parent of parents) {
            if (parent.email) {
              try {
                await sendInviteEmail({
                  toEmail: parent.email,
                  subject: eventTitle,
                  html: emailHtml,
                  text: emailText,
                });
                await adminSupabase
                  .from("notification_deliveries")
                  .update({ email_status: "sent", delivered_at: new Date().toISOString() } as unknown as never)
                  .eq("campaign_id", campaignId)
                  .eq("profile_id", parent.id);
              } catch {
                await adminSupabase
                  .from("notification_deliveries")
                  .update({ email_status: "failed" } as unknown as never)
                  .eq("campaign_id", campaignId)
                  .eq("profile_id", parent.id);
              }
            } else {
              await adminSupabase
                .from("notification_deliveries")
                .update({ email_status: "skipped" } as unknown as never)
                .eq("campaign_id", campaignId)
                .eq("profile_id", parent.id);
            }
          }

          // Mark campaign complete.
          await adminSupabase
            .from("notification_campaigns")
            .update({ status: "sent", completed_at: new Date().toISOString() } as unknown as never)
            .eq("id", campaignId);
        }
      }

      if (notify_day_of) {
        // Create scheduled reminder for event day at 08:00 UTC.
        const [datePart] = (starts_at as string).split("T");
        const [yr, mo, dy] = datePart.split("-").map(Number);
        const scheduledFor = new Date(Date.UTC(yr, mo - 1, dy, 8, 0, 0));

        const reminderTitle = `Recordatorio: ${(inserted as unknown as { title: string }).title}`;

        const { data: scheduledCampaign } = await adminSupabase
          .from("notification_campaigns")
          .insert({
            title: reminderTitle,
            subject: `Hoy: ${(inserted as unknown as { title: string }).title}`,
            body: eventDescription ?? (inserted as unknown as { title: string }).title,
            target_audience: "parents",
            delivery_mode: "scheduled",
            status: "scheduled",
            scheduled_for: scheduledFor.toISOString(),
            send_email: true,
            send_in_app: true,
            created_by_profile_id: userData.user.id,
          } as unknown as never)
          .select("id")
          .single();

        const scheduledCampaignId = (scheduledCampaign as unknown as { id: string } | null)?.id;

        if (scheduledCampaignId) {
          await adminSupabase
            .from("notification_deliveries")
            .insert(
              parentProfileIds.map((pid) => ({
                campaign_id: scheduledCampaignId,
                profile_id: pid,
                email_status: "pending",
                in_app_status: "unread",
              })) as unknown as never[]
            );
        }
      }
    }
  }

  return NextResponse.json({ ok: true, event: inserted }, { status: 201 });
}
