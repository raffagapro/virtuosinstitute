/**
 * Tests for school-calendar birthday computation logic.
 * The computation function is extracted here for unit testing.
 */

// ── Extracted utility (mirrors the implementation in route.ts) ────────────────

interface BirthdayPerson {
  id: string;
  name: string;
  dob: string; // "YYYY-MM-DD"
  type: "student" | "staff";
}

interface BirthdayEvent {
  id: string;
  title: string;
  description: null;
  event_type: string;
  starts_at: string;
  ends_at: string;
  is_birthday: true;
}

function computeBirthdayEvents(
  people: BirthdayPerson[],
  from: Date,
  to: Date
): BirthdayEvent[] {
  const results: BirthdayEvent[] = [];
  const fromYear = from.getFullYear();
  const toYear = to.getFullYear();

  for (const person of people) {
    const parts = person.dob.split("-");
    if (parts.length < 3) continue;
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    for (let year = fromYear; year <= toYear; year++) {
      const birthdayStart = new Date(year, month, day, 0, 0, 0);
      const birthdayEnd = new Date(year, month, day, 23, 59, 59);

      if (birthdayStart >= from && birthdayStart <= to) {
        results.push({
          id: `birthday-${person.type}-${person.id}-${year}`,
          title: person.name,
          description: null,
          event_type:
            person.type === "student" ? "student_birthday" : "staff_birthday",
          starts_at: birthdayStart.toISOString(),
          ends_at: birthdayEnd.toISOString(),
          is_birthday: true,
        });
      }
    }
  }

  return results;
}

// ── Test data ────────────────────────────────────────────────────────────────

const STUDENT: BirthdayPerson = {
  id: "s1",
  name: "Ana García",
  dob: "2015-06-15",
  type: "student",
};

const STAFF: BirthdayPerson = {
  id: "p1",
  name: "Carlos López",
  dob: "1985-12-31",
  type: "staff",
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("computeBirthdayEvents", () => {
  test("returns birthday event when DOB falls within the range", () => {
    const from = new Date(2025, 5, 1); // June 1
    const to = new Date(2025, 5, 30); // June 30

    const events = computeBirthdayEvents([STUDENT], from, to);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("birthday-student-s1-2025");
    expect(events[0].title).toBe("Ana García");
    expect(events[0].event_type).toBe("student_birthday");
    expect(events[0].is_birthday).toBe(true);
  });

  test("does not return birthday event when DOB falls outside the range", () => {
    const from = new Date(2025, 6, 1); // July 1
    const to = new Date(2025, 6, 31); // July 31

    const events = computeBirthdayEvents([STUDENT], from, to);
    expect(events).toHaveLength(0);
  });

  test("uses staff_birthday event_type for staff people", () => {
    const from = new Date(2025, 11, 1); // Dec 1
    const to = new Date(2025, 11, 31); // Dec 31

    const events = computeBirthdayEvents([STAFF], from, to);
    expect(events).toHaveLength(1);
    expect(events[0].event_type).toBe("staff_birthday");
    expect(events[0].id).toBe("birthday-staff-p1-2025");
  });

  test("handles Dec 31 birthday in a range spanning year boundary", () => {
    const from = new Date(2025, 11, 15); // Dec 15 2025
    const to = new Date(2026, 0, 15);   // Jan 15 2026

    const events = computeBirthdayEvents([STAFF], from, to);
    // Dec 31 2025 falls in range; Jan 1 2026 does not (31 Dec is the DOB)
    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("birthday-staff-p1-2025");
  });

  test("generates events for each year when range spans multiple years", () => {
    const from = new Date(2024, 5, 1);
    const to = new Date(2026, 5, 30);

    const events = computeBirthdayEvents([STUDENT], from, to);
    // June 15 appears in 2024, 2025, 2026
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.id)).toEqual([
      "birthday-student-s1-2024",
      "birthday-student-s1-2025",
      "birthday-student-s1-2026",
    ]);
  });

  test("handles multiple people with birthdays in the range", () => {
    const from = new Date(2025, 5, 1);
    const to = new Date(2025, 11, 31);

    const events = computeBirthdayEvents([STUDENT, STAFF], from, to);
    expect(events).toHaveLength(2);
    const types = events.map((e) => e.event_type).sort();
    expect(types).toEqual(["staff_birthday", "student_birthday"]);
  });

  test("returns empty array for empty people list", () => {
    const from = new Date(2025, 0, 1);
    const to = new Date(2025, 11, 31);
    expect(computeBirthdayEvents([], from, to)).toEqual([]);
  });

  test("skips entries with malformed dob strings", () => {
    const bad: BirthdayPerson = { id: "x", name: "Bad Date", dob: "invalid", type: "student" };
    const from = new Date(2025, 0, 1);
    const to = new Date(2025, 11, 31);
    // Should not throw; just produce zero events for the bad entry.
    expect(() => computeBirthdayEvents([bad], from, to)).not.toThrow();
  });

  test("birthday exactly on range boundary is included", () => {
    const from = new Date(2025, 5, 15, 0, 0, 0); // June 15 00:00
    const to = new Date(2025, 5, 15, 23, 59, 59);  // June 15 23:59

    const events = computeBirthdayEvents([STUDENT], from, to);
    expect(events).toHaveLength(1);
  });
});
