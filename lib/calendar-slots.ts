/**
 * Slot computation utility for the appointment calendar system.
 *
 * Computes bookable time slots from availability rules, subtracting calendar
 * blocks (manual unavailability) and already-requested/confirmed appointments.
 * Does not touch the database — all inputs are plain data objects.
 */

export interface AvailabilityRule {
  id: string;
  weekday: number; // 0 = Sunday … 6 = Saturday
  start_time: string; // "HH:MM" or "HH:MM:SS"
  end_time: string;
  slot_minutes: number; // 30 | 60
  effective_from: string; // "YYYY-MM-DD"
  effective_to: string | null; // "YYYY-MM-DD" | null
}

export interface CalendarBlock {
  starts_at: string; // ISO timestamp
  ends_at: string;
}

export interface AppointmentBrief {
  id: string;
  starts_at: string; // ISO timestamp
  ends_at: string;
  status: string; // "requested" | "confirmed" | "completed" | "canceled" | "no_show"
}

export type SlotStatus = "available" | "requested" | "confirmed";

export interface ComputedSlot {
  startsAt: Date;
  endsAt: Date;
  status: SlotStatus;
  appointmentId?: string;
}

/** Parse "HH:MM" or "HH:MM:SS" into { hours, minutes }. */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number);
  return { hours: h, minutes: m };
}

/** Return a new Date with the given hour/minute applied to the base date, keeping local time. */
function applyTime(base: Date, hours: number, minutes: number): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Compute all bookable slots for a set of availability rules over a date range.
 *
 * @param rules        Availability rules for the calendar.
 * @param fromDate     Start of the date range (inclusive, time ignored).
 * @param toDate       End of the date range (inclusive, time ignored).
 * @param appointments Existing appointments for overlap checking.
 * @param blocks       Manual calendar blocks for overlap checking.
 * @returns            Sorted, deduplicated array of computed slots.
 */
export function computeSlots(
  rules: AvailabilityRule[],
  fromDate: Date,
  toDate: Date,
  appointments: AppointmentBrief[],
  blocks: CalendarBlock[]
): ComputedSlot[] {
  // Pre-parse appointment and block ranges for fast overlap testing.
  const apptRanges = appointments
    .filter((a) => a.status === "requested" || a.status === "confirmed")
    .map((a) => ({
      id: a.id,
      status: a.status as "requested" | "confirmed",
      starts: new Date(a.starts_at),
      ends: new Date(a.ends_at),
    }));

  const blockRanges = blocks.map((b) => ({
    starts: new Date(b.starts_at),
    ends: new Date(b.ends_at),
  }));

  const seen = new Set<string>();
  const slots: ComputedSlot[] = [];

  for (const rule of rules) {
    const effectiveFrom = new Date(rule.effective_from + "T00:00:00");
    const effectiveTo = rule.effective_to ? new Date(rule.effective_to + "T23:59:59") : null;

    // Walk day by day through the requested range.
    const day = new Date(fromDate);
    day.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(toDate);
    rangeEnd.setHours(23, 59, 59, 999);

    while (day <= rangeEnd) {
      const matchesWeekday = day.getDay() === rule.weekday;
      const inEffect = day >= effectiveFrom && (!effectiveTo || day <= effectiveTo);

      if (matchesWeekday && inEffect) {
        const { hours: startH, minutes: startM } = parseTime(rule.start_time);
        const { hours: endH, minutes: endM } = parseTime(rule.end_time);

        let slotStart = applyTime(day, startH, startM);
        const windowEnd = applyTime(day, endH, endM);

        while (slotStart < windowEnd) {
          const slotEnd = new Date(slotStart.getTime() + rule.slot_minutes * 60_000);
          if (slotEnd > windowEnd) break;

          // Skip if a calendar block covers this slot.
          const blocked = blockRanges.some(
            (b) => slotStart < b.ends && slotEnd > b.starts
          );

          if (!blocked) {
            const key = slotStart.toISOString();
            if (!seen.has(key)) {
              seen.add(key);

              const overlap = apptRanges.find(
                (a) => slotStart < a.ends && slotEnd > a.starts
              );

              slots.push({
                startsAt: new Date(slotStart),
                endsAt: new Date(slotEnd),
                status: overlap ? overlap.status : "available",
                appointmentId: overlap?.id,
              });
            }
          }

          slotStart = new Date(slotEnd);
        }
      }

      day.setDate(day.getDate() + 1);
    }
  }

  slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return slots;
}

/**
 * Build a Google Calendar "add event" URL that opens pre-filled in the browser.
 * No server credentials required — the user clicks the link from their email/page.
 */
export function buildGCalUrl(params: {
  title: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  location?: string;
}): string {
  /** Format a Date as "YYYYMMDDTHHmmssZ" (UTC) for Google Calendar. */
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const url = new URL("https://calendar.google.com/calendar/r/eventedit");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", params.title);
  url.searchParams.set("dates", `${fmt(params.startsAt)}/${fmt(params.endsAt)}`);
  if (params.description) url.searchParams.set("details", params.description);
  if (params.location) url.searchParams.set("location", params.location);
  return url.toString();
}

/**
 * Build an RFC 5545 ICS string for a single VEVENT.
 * Used by GET /api/appointments/[id]/ics to generate a downloadable file.
 */
export function buildICS(params: {
  uid: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  organizer?: string;
}): string {
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  // Fold long lines at 75 chars per RFC 5545.
  const fold = (line: string) => {
    const chunks: string[] = [];
    while (line.length > 75) {
      chunks.push(line.slice(0, 75));
      line = " " + line.slice(75);
    }
    chunks.push(line);
    return chunks.join("\r\n");
  };

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Virtuós Institute//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}@virtuosinstitute.com`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(params.startsAt)}`,
    `DTEND:${fmt(params.endsAt)}`,
    fold(`SUMMARY:${params.title}`),
  ];

  if (params.description) {
    lines.push(fold(`DESCRIPTION:${params.description.replace(/\n/g, "\\n")}`));
  }
  if (params.organizer) {
    lines.push(`ORGANIZER;CN=${params.organizer}:mailto:noreply@virtuosinstitute.com`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
