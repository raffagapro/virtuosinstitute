"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Download } from "lucide-react";

type DeptCalendar = "coordination_appointments" | "direction_appointments";
type Tab = "book" | "myAppointments";

interface ComputedSlot {
  startsAt: string;
  endsAt: string;
  status: "available" | "requested" | "confirmed";
  appointmentId: string | null;
}

interface ChildOption {
  id: string;
  fullName: string;
}

interface ParentAppointment {
  id: string;
  status: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  calendars: { calendar_type: string } | null;
}

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  tabs: { book: string; myAppointments: string };
  book: {
    selectDepartment: string;
    coordination: string;
    direction: string;
    noSlots: string;
    available: string;
    requestedByOther: string;
    selectSlot: string;
    subject: string;
    subjectPlaceholder: string;
    linkChild: string;
    linkChildNone: string;
    submit: string;
    submitting: string;
    cancel: string;
    successMessage: string;
    errorUnavailable: string;
    errorGeneric: string;
    weekNav: { prev: string; next: string };
  };
  myAppointments: {
    empty: string;
    status: Record<string, string>;
    addToCalendar: string;
    downloadIcs: string;
  };
}

interface ParentAppointmentsPageProps {
  labels: Labels;
}

const DEPT_LABELS: Record<DeptCalendar, keyof Labels["book"]> = {
  coordination_appointments: "coordination",
  direction_appointments: "direction",
};

export function ParentAppointmentsPage({ labels }: ParentAppointmentsPageProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("book");
  const [selectedDept, setSelectedDept] = useState<DeptCalendar>("coordination_appointments");

  // Week navigation
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Slots
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Booking form
  const [selectedSlot, setSelectedSlot] = useState<ComputedSlot | null>(null);
  const [subjectNote, setSubjectNote] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [children, setChildren] = useState<ChildOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // My appointments
  const [myAppointments, setMyAppointments] = useState<ParentAppointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Initialize session.
  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(labels.error); setLoading(false); return; }
      setAccessToken(session.access_token);
      setLoading(false);
    }
    init();
  }, [labels.error]);

  // Load children for the link-child selector (reuse parent children API).
  useEffect(() => {
    if (!accessToken) return;
    fetch("/api/parent/children", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setChildren(
            (data.children ?? []).map((c: { id: string; fullName: string }) => ({
              id: c.id,
              fullName: c.fullName,
            }))
          );
        }
      });
  }, [accessToken]);

  const fetchSlots = useCallback(
    async (dept: DeptCalendar, from: Date, token: string) => {
      setLoadingSlots(true);
      const toDate = addDays(from, 6);
      const res = await fetch(
        `/api/appointments/slots?calendarType=${dept}&from=${format(from, "yyyy-MM-dd")}&to=${format(toDate, "yyyy-MM-dd")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSlots(data.ok ? data.slots : []);
      setLoadingSlots(false);
    },
    []
  );

  const fetchMyAppointments = useCallback(async (token: string) => {
    setLoadingAppts(true);
    // Query appointments where the current user is the requester.
    // We reuse the slots endpoint indirectly — instead, call the staff queue
    // but filter by requester; for parents we use a direct Supabase query via
    // the server. For now, we call the staff appointments endpoint which already
    // returns requester_profile. Parents do not have access to that route, so
    // we implement a simple parent-facing fetch via Supabase client directly.
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingAppts(false); return; }

    const { data: appts } = await supabase
      .from("appointments")
      .select("id, status, starts_at, ends_at, reason, calendars(calendar_type)")
      .eq("requester_profile_id", user.id)
      .order("starts_at", { ascending: false });

    setMyAppointments((appts ?? []) as ParentAppointment[]);
    setLoadingAppts(false);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === "book") fetchSlots(selectedDept, weekStart, accessToken);
    if (activeTab === "myAppointments") fetchMyAppointments(accessToken);
  }, [accessToken, activeTab, selectedDept, weekStart, fetchSlots, fetchMyAppointments]);

  async function handleBookSlot() {
    if (!accessToken || !selectedSlot) return;
    setSubmitting(true);
    setBookingError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        calendarType: selectedDept,
        startsAt: selectedSlot.startsAt,
        endsAt: selectedSlot.endsAt,
        requesterNote: subjectNote || undefined,
        studentId: selectedChildId || null,
      }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!data.ok) {
      const msg =
        data.reason === "slot-unavailable" || data.reason === "slot-blocked"
          ? labels.book.errorUnavailable
          : labels.book.errorGeneric;
      setBookingError(msg);
      return;
    }

    setBookingSuccess(true);
    setSelectedSlot(null);
    setSubjectNote("");
    setSelectedChildId("");
    fetchSlots(selectedDept, weekStart, accessToken);
  }

  // Group slots by date for display.
  const slotsByDate: Record<string, ComputedSlot[]> = {};
  for (const slot of slots) {
    const dateKey = format(new Date(slot.startsAt), "yyyy-MM-dd");
    (slotsByDate[dateKey] ??= []).push(slot);
  }

  const STATUS_COLORS: Record<string, string> = {
    requested: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-gray-100 text-gray-600",
    no_show: "bg-red-100 text-red-700",
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-6 text-[#2b5876]">
        {labels.loading}
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-6 text-[#fa4361]">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-[#EC4899]" />
          <div>
            <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">
              {labels.title}
            </h1>
            <p className="mt-1 text-sm text-[#2b5876]">{labels.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-[#d6e8f6] bg-white">
        <div className="flex border-b border-[#d6e8f6]">
          {(["book", "myAppointments"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setBookingSuccess(false); setSelectedSlot(null); }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[#EC4899] text-[#003F60]"
                  : "text-[#2b5876] hover:text-[#003F60]"
              }`}
            >
              {labels.tabs[tab]}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {/* ── Book Tab ── */}
          {activeTab === "book" && (
            <div className="space-y-4">
              {/* Department selector */}
              <div className="flex gap-2">
                {(["coordination_appointments", "direction_appointments"] as DeptCalendar[]).map(
                  (dept) => (
                    <button
                      key={dept}
                      onClick={() => { setSelectedDept(dept); setSelectedSlot(null); setBookingSuccess(false); }}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                        selectedDept === dept
                          ? "bg-[#003F60] text-white"
                          : "bg-[#f0f8ff] text-[#003F60] hover:bg-[#d6e8f6]"
                      }`}
                    >
                      {labels.book[DEPT_LABELS[dept]] as string}
                    </button>
                  )
                )}
              </div>

              {/* Week navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setWeekStart((d) => addDays(d, -7))}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#003F60] hover:bg-[#f0f8ff]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {labels.book.weekNav.prev}
                </button>
                <span className="text-sm font-medium text-[#003F60]">
                  {format(weekStart, "dd MMM")} – {format(addDays(weekStart, 6), "dd MMM yyyy")}
                </span>
                <button
                  onClick={() => setWeekStart((d) => addDays(d, 7))}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-[#003F60] hover:bg-[#f0f8ff]"
                >
                  {labels.book.weekNav.next}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {bookingSuccess && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {labels.book.successMessage}
                </div>
              )}

              {loadingSlots ? (
                <p className="text-sm text-[#2b5876]">{labels.loading}</p>
              ) : Object.keys(slotsByDate).length === 0 ? (
                <p className="text-sm text-[#2b5876]">{labels.book.noSlots}</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(slotsByDate).map(([dateKey, daySlots]) => (
                    <div key={dateKey}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#2b5876]">
                        {format(new Date(dateKey + "T00:00:00"), "EEEE, dd MMM")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map((slot) => {
                          const isAvailable = slot.status === "available";
                          const isSelected =
                            selectedSlot?.startsAt === slot.startsAt;
                          return (
                            <button
                              key={slot.startsAt}
                              disabled={!isAvailable}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setBookingSuccess(false);
                                setBookingError(null);
                              }}
                              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-[#003F60] text-white"
                                  : isAvailable
                                  ? "border border-[#d6e8f6] bg-white text-[#003F60] hover:bg-[#f0f8ff]"
                                  : "cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-400"
                              }`}
                            >
                              {format(new Date(slot.startsAt), "HH:mm")}
                              {!isAvailable && (
                                <span className="ml-1 text-xs opacity-60">✕</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Booking form */}
              {selectedSlot && (
                <div className="rounded-xl border border-[#d6e8f6] bg-[#f5fbff] p-4 space-y-3">
                  <p className="text-sm font-medium text-[#003F60]">
                    {labels.book.selectSlot}:{" "}
                    {format(new Date(selectedSlot.startsAt), "EEEE dd MMM, HH:mm")}
                    {" – "}
                    {format(new Date(selectedSlot.endsAt), "HH:mm")}
                  </p>

                  <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                    {labels.book.subject}
                    <textarea
                      value={subjectNote}
                      onChange={(e) => setSubjectNote(e.target.value)}
                      placeholder={labels.book.subjectPlaceholder}
                      rows={2}
                      className="rounded-lg border border-[#d6e8f6] bg-white p-2 text-sm text-[#003F60] focus:outline-none focus:ring-1 focus:ring-[#EC4899]"
                    />
                  </label>

                  {children.length > 0 && (
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.book.linkChild}
                      <select
                        value={selectedChildId}
                        onChange={(e) => setSelectedChildId(e.target.value)}
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      >
                        <option value="">{labels.book.linkChildNone}</option>
                        {children.map((child) => (
                          <option key={child.id} value={child.id}>
                            {child.fullName}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  {bookingError && (
                    <p className="text-xs text-[#fa4361]">{bookingError}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={handleBookSlot}
                      disabled={submitting}
                      className="rounded-lg bg-[#003F60] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#002d47] disabled:opacity-50"
                    >
                      {submitting ? labels.book.submitting : labels.book.submit}
                    </button>
                    <button
                      onClick={() => { setSelectedSlot(null); setBookingError(null); }}
                      className="rounded-lg bg-[#f0f8ff] px-4 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#d6e8f6]"
                    >
                      {labels.book.cancel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── My Appointments Tab ── */}
          {activeTab === "myAppointments" && (
            <div className="space-y-3">
              {loadingAppts ? (
                <p className="text-sm text-[#2b5876]">{labels.loading}</p>
              ) : myAppointments.length === 0 ? (
                <p className="text-sm text-[#2b5876]">{labels.myAppointments.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {myAppointments.map((appt) => {
                    const calType = appt.calendars?.calendar_type ?? "";
                    const DEPT_NAMES: Record<string, string> = {
                      coordination_appointments: labels.book.coordination,
                      direction_appointments: labels.book.direction,
                    };
                    return (
                      <li
                        key={appt.id}
                        className="rounded-xl border border-[#d6e8f6] p-4 text-sm space-y-2"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {labels.myAppointments.status[appt.status] ?? appt.status}
                          </span>
                          <span className="font-medium text-[#003F60]">
                            {format(new Date(appt.starts_at), "dd MMM yyyy, HH:mm")}
                            {" – "}
                            {format(new Date(appt.ends_at), "HH:mm")}
                          </span>
                          {DEPT_NAMES[calType] && (
                            <span className="rounded-full bg-[#f0f8ff] px-2 py-0.5 text-xs text-[#003F60]">
                              {DEPT_NAMES[calType]}
                            </span>
                          )}
                        </div>

                        {/* Calendar export links — only for confirmed appointments */}
                        {appt.status === "confirmed" && accessToken && (
                          <div className="flex gap-3">
                            <a
                              href={`/api/appointments/${appt.id}/ics?format=gcal`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-[#60A5FA] hover:underline"
                              onClick={async (e) => {
                                e.preventDefault();
                                const res = await fetch(
                                  `/api/appointments/${appt.id}/ics?format=gcal`,
                                  { headers: { Authorization: `Bearer ${accessToken}` } }
                                );
                                const d = await res.json();
                                if (d.url) window.open(d.url, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {labels.myAppointments.addToCalendar}
                            </a>
                            <a
                              href={`/api/appointments/${appt.id}/ics`}
                              download={`cita-${appt.id}.ics`}
                              onClick={(e) => {
                                e.preventDefault();
                                fetch(`/api/appointments/${appt.id}/ics`, {
                                  headers: { Authorization: `Bearer ${accessToken}` },
                                })
                                  .then((r) => r.blob())
                                  .then((blob) => {
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = `cita-${appt.id}.ics`;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  });
                              }}
                              className="flex items-center gap-1 text-xs text-[#2b5876] hover:underline"
                            >
                              <Download className="h-3 w-3" />
                              {labels.myAppointments.downloadIcs}
                            </a>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
