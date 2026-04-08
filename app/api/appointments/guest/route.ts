import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

interface GuestTourPayload {
  parentName: string;
  contactEmail: string;
  contactPhone?: string;
  gradeOfInterest?: string;
  notes?: string;
  preferredDate?: string; // YYYY-MM-DD (informational only, not a booked slot)
}

/**
 * POST /api/appointments/guest
 * Public endpoint (no auth required) for guests to submit a tour/info request.
 * Creates a guest_tour_request record and notifies the clerk (email via Brevo is
 * wired in a follow-up implementation step per EXECUTION_PLAN).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: GuestTourPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-json" }, { status: 400 });
  }

  const { parentName, contactEmail, contactPhone, gradeOfInterest, notes, preferredDate } = body;

  if (!parentName?.trim()) {
    return NextResponse.json({ ok: false, reason: "name-required" }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contactEmail?.trim() || !emailPattern.test(contactEmail.trim())) {
    return NextResponse.json({ ok: false, reason: "invalid-email" }, { status: 400 });
  }

  let adminSupabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    adminSupabase = getSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, reason: "service-role-missing" }, { status: 503 });
  }

  const insertPayload: Record<string, unknown> = {
    parent_name: parentName.trim(),
    contact_email: contactEmail.trim().toLowerCase(),
    status: "requested",
  };
  if (contactPhone?.trim()) insertPayload.contact_phone = contactPhone.trim();
  if (gradeOfInterest?.trim()) insertPayload.grade_of_interest = gradeOfInterest.trim();
  if (notes?.trim()) insertPayload.notes = notes.trim();
  if (preferredDate) {
    // Store as requested_datetime at noon UTC to avoid TZ off-by-one issues.
    insertPayload.requested_datetime = new Date(preferredDate + "T12:00:00Z").toISOString();
  }

  const { data: newRequest, error: insertErr } = await adminSupabase
    .from("guest_tour_requests")
    .insert(insertPayload)
    .select("id, parent_name, contact_email, status, created_at")
    .single();

  if (insertErr || !newRequest) {
    return NextResponse.json({ ok: false, reason: "create-failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, request: newRequest }, { status: 201 });
}
