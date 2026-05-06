import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase";

const NOTE_MANAGER_ROLES = ["school_owner", "direction", "coordination", "clerk"];

function getBearerToken(req: NextRequest): string | null {
  const [scheme, token] = (req.headers.get("authorization") ?? "").split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

interface NotePayload {
  noteBody: string;
  outcome?: string;
  includeInStudentRecord?: boolean;
}

/**
 * POST /api/appointments/[id]/notes
 * Staff adds a resolution note to an appointment.
 * If includeInStudentRecord=true and the appointment has a student_id,
 * the note's linked_student_id is set so it surfaces in the student record.
 */
export async function POST(
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

  const { data: memberships } = await adminSupabase
    .from("school_memberships")
    .select("school_role")
    .eq("profile_id", userData.user.id)
    .eq("is_active", true)
    .eq("approval_status", "approved");

  const roles: string[] = ((memberships as unknown as Array<{ school_role: string }> | null) ?? []).map(
    (m) => m.school_role
  );
  if (!roles.some((r) => NOTE_MANAGER_ROLES.includes(r))) {
    return NextResponse.json({ ok: false, reason: "forbidden" }, { status: 403 });
  }

  // Fetch the appointment to check it exists and get student_id.
  const { data: appt } = await adminSupabase
    .from("appointments")
    .select("id, student_id, status")
    .eq("id", appointmentId)
    .single();

  if (!appt) {
    return NextResponse.json({ ok: false, reason: "appointment-not-found" }, { status: 404 });
  }

  const { student_id: linkedStudent } = appt as unknown as { id: string; student_id: string | null; status: string };

  let body: NotePayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const { noteBody, outcome, includeInStudentRecord } = body;

  if (!noteBody?.trim()) {
    return NextResponse.json({ ok: false, reason: "note-body-required" }, { status: 400 });
  }

  const VALID_OUTCOMES = ["completed", "no_show", "rescheduled", "canceled", "note"];
  if (outcome && !VALID_OUTCOMES.includes(outcome)) {
    return NextResponse.json({ ok: false, reason: "invalid-outcome" }, { status: 400 });
  }

  const noteInsert: Record<string, unknown> = {
    appointment_id: appointmentId,
    author_profile_id: userData.user.id,
    note_body: noteBody.trim(),
  };
  if (outcome) noteInsert.outcome = outcome;
  if (includeInStudentRecord && linkedStudent) {
    noteInsert.linked_student_id = linkedStudent;
  }

  const { data: newNote, error: insertErr } = await adminSupabase
    .from("appointment_notes")
    .insert(noteInsert)
    .select("id, note_body, outcome, linked_student_id, created_at")
    .single();

  if (insertErr || !newNote) {
    return NextResponse.json({ ok: false, reason: "create-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, note: newNote }, { status: 201 });
}
