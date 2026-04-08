"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CalendarDays, Clock, Trash2, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { AppCalendarGrid, type CalendarEvent, type AppCalendarGridLabels } from "@/components/ui/AppCalendarGrid";

const WEEKDAY_KEYS = [0, 1, 2, 3, 4, 5, 6] as const;

interface AvailabilityRule {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  effective_from: string;
  effective_to: string | null;
}

interface CalendarBlock {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
}

interface AppointmentRow {
  id: string;
  status: string;
  requested_by_role: string;
  reason: string | null;
  starts_at: string;
  ends_at: string;
  student_id: string | null;
  requester_profile: { id: string; full_name: string; email: string } | null;
  calendars: { calendar_type: string } | null;
}

interface CalendarInfo {
  id: string;
  calendar_type: string;
  title: string;
}

type Tab = "availability" | "blocks" | "appointments" | "calendar";
type AppointmentFilter = "all" | "requested" | "confirmed" | "completed";

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  noCalendar: string;
  tabs: { availability: string; blocks: string; appointments: string; calendar: string; school: string };
  calendarGrid: AppCalendarGridLabels;
  availability: {
    heading: string;
    empty: string;
    addButton: string;
    weekday: string;
    startTime: string;
    endTime: string;
    slotDuration: string;
    slotDuration30: string;
    slotDuration60: string;
    effectiveFrom: string;
    effectiveTo: string;
    effectiveToOptional: string;
    save: string;
    saving: string;
    cancel: string;
    deleteButton: string;
    deleteConfirm: string;
    createError: string;
    deleteError: string;
    weekdays: Record<number, string>;
  };
  blocks: {
    heading: string;
    empty: string;
    addButton: string;
    startsAt: string;
    endsAt: string;
    reason: string;
    reasonPlaceholder: string;
    save: string;
    saving: string;
    cancel: string;
    deleteButton: string;
    createError: string;
    deleteError: string;
  };
  appointments: {
    heading: string;
    empty: string;
    requested: string;
    confirmed: string;
    completed: string;
    canceled: string;
    noShow: string;
    approveButton: string;
    rejectButton: string;
    completeButton: string;
    noShowButton: string;
    addNoteButton: string;
    noteBody: string;
    noteBodyPlaceholder: string;
    outcome: string;
    includeInRecord: string;
    saveNote: string;
    savingNote: string;
    cancelNote: string;
    actionError: string;
    noteError: string;
    requesterNote: string;
    linkedStudent: string;
    filterAll: string;
    filterPending: string;
    filterConfirmed: string;
    filterCompleted: string;
  };
  schoolCalendar: {
    loading: string;
    error: string;
    empty: string;
    addEvent: string;
    form: {
      title: string;
      titlePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      startsAt: string;
      endsAt: string;
      save: string;
      saving: string;
      cancel: string;
      deleteButton: string;
      deleteConfirm: string;
      createError: string;
      deleteError: string;
      editHeading: string;
      newHeading: string;
      notifyParents: string;
      notifyDayOf: string;
    };
    eventType: Record<string, string>;
  };
}

interface StaffCalendarPageProps {
  labels: Labels;
}

export function StaffCalendarPage({ labels }: StaffCalendarPageProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<CalendarInfo | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("calendar");

  // Availability state
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    weekday: "1",
    startTime: "09:00",
    endTime: "17:00",
    slotMinutes: "30",
    effectiveFrom: format(new Date(), "yyyy-MM-dd"),
    effectiveTo: "",
  });
  const [savingRule, setSavingRule] = useState(false);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);

  // Blocks state
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ startsAt: "", endsAt: "", reason: "" });
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockError, setBlockError] = useState<string | null>(null);
  const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);

  // Appointments state
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [apptFilter, setApptFilter] = useState<AppointmentFilter>("all");
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [expandedApptId, setExpandedApptId] = useState<string | null>(null);
  const [processingApptId, setProcessingApptId] = useState<string | null>(null);
  const [apptActionError, setApptActionError] = useState<string | null>(null);
  // Appointment calendar view state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  // School calendar state
  interface SchoolEvent {
    id: string;
    title: string;
    description: string | null;
    event_type: string;
    starts_at: string;
    ends_at: string;
    is_birthday: boolean;
    role?: string;
  }
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [loadingSchool, setLoadingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [canManageSchool, setCanManageSchool] = useState(false);
  const [schoolFrom, setSchoolFrom] = useState<Date | null>(null);
  const [schoolTo, setSchoolTo] = useState<Date | null>(null);
  // School event form state
  const [showSchoolForm, setShowSchoolForm] = useState(false);
  const [editingSchoolEvent, setEditingSchoolEvent] = useState<SchoolEvent | null>(null);
  const [schoolForm, setSchoolForm] = useState({ title: "", description: "", startsAt: "", endsAt: "", notifyParents: false, notifyDayOf: false });
  const [savingSchool, setSavingSchool] = useState(false);
  const [schoolFormError, setSchoolFormError] = useState<string | null>(null);
  const [deletingSchoolId, setDeletingSchoolId] = useState<string | null>(null);

  // Note form per appointment
  const [noteFormId, setNoteFormId] = useState<string | null>(null);
  const [noteForm, setNoteForm] = useState({ body: "", outcome: "", includeInRecord: false });
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Initialize: get session token + calendar info.
  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setInitError(labels.error);
        setLoadingInit(false);
        return;
      }
      const token = session.access_token;
      setAccessToken(token);

      const res = await fetch("/api/staff/calendar-info", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.ok) {
        setInitError(data.reason === "no-calendar-for-role" ? labels.noCalendar : labels.error);
        setLoadingInit(false);
        return;
      }
      if (!data.calendars?.length) {
        setInitError(labels.noCalendar);
        setLoadingInit(false);
        return;
      }
      const deptCalendars: CalendarInfo[] = data.calendars;
      const allCalendars: CalendarInfo[] = [
        ...deptCalendars,
        { id: "school_events", calendar_type: "school_events", title: labels.tabs.school },
      ];
      setCalendars(allCalendars);
      setActiveCalendar(deptCalendars[0]);
      setIsReadOnly(data.isReadOnly ?? false);
      setLoadingInit(false);
    }
    init();
  }, [labels.error, labels.noCalendar]);

  const fetchRules = useCallback(async (calId: string, token: string) => {
    const res = await fetch(`/api/staff/availability?calendarType=${encodeURIComponent(calId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) setRules(data.rules ?? []);
  }, []);

  const fetchBlocks = useCallback(async (calId: string, token: string) => {
    const res = await fetch(`/api/staff/calendar-blocks?calendarType=${encodeURIComponent(calId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) setBlocks(data.blocks ?? []);
  }, []);

  const fetchAppointments = useCallback(async (calType: string, token: string, filter: AppointmentFilter) => {
    setLoadingAppts(true);
    const statusParam = filter === "all" ? "" : `&status=${filter === "completed" ? "completed,no_show,canceled" : filter}`;
    const res = await fetch(`/api/staff/appointments?calendarType=${calType}${statusParam}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.ok) setAppointments(data.appointments ?? []);
    setLoadingAppts(false);
  }, []);

  const fetchCalendarEvents = useCallback(
    async (calType: string, token: string, from: Date, to: Date) => {
      setLoadingCalendar(true);
      const res = await fetch(
        `/api/staff/appointments?calendarType=${calType}&from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.ok) {
        const evts: CalendarEvent[] = (
          data.appointments as Array<{
            id: string;
            starts_at: string;
            ends_at: string;
            status: string;
            requester_profile: { full_name: string } | null;
          }>
        ).map((a) => ({
          id: a.id,
          title: a.requester_profile?.full_name ?? "—",
          startsAt: new Date(a.starts_at),
          endsAt: new Date(a.ends_at),
          status: a.status,
        }));
        setCalendarEvents(evts);
      }
      setLoadingCalendar(false);
    },
    []
  );

  const handleRangeChange = useCallback(
    (from: Date, to: Date) => {
      if (!activeCalendar || !accessToken) return;
      fetchCalendarEvents(activeCalendar.calendar_type, accessToken, from, to);
    },
    [activeCalendar, accessToken, fetchCalendarEvents]
  );

  const fetchSchoolEvents = useCallback(
    async (token: string, from: Date, to: Date) => {
      setLoadingSchool(true);
      setSchoolError(null);
      try {
        const res = await fetch(
          `/api/school-calendar/events?from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.ok) {
          setSchoolEvents(data.events ?? []);
          setCanManageSchool(data.canWrite ?? false);
        } else {
          setSchoolError(labels.schoolCalendar.error);
        }
      } catch {
        setSchoolError(labels.schoolCalendar.error);
      }
      setLoadingSchool(false);
    },
    [labels.schoolCalendar.error]
  );

  const handleSchoolRangeChange = useCallback(
    (from: Date, to: Date) => {
      if (!accessToken) return;
      setSchoolFrom(from);
      setSchoolTo(to);
      fetchSchoolEvents(accessToken, from, to);
    },
    [accessToken, fetchSchoolEvents]
  );

  // Load data when active calendar or tab changes.
  useEffect(() => {
    if (!activeCalendar || !accessToken) return;
    if (activeTab === "availability") fetchRules(activeCalendar.calendar_type, accessToken);
    if (activeTab === "blocks") fetchBlocks(activeCalendar.calendar_type, accessToken);
    if (activeTab === "appointments") fetchAppointments(activeCalendar.calendar_type, accessToken, apptFilter);
  }, [activeCalendar, activeTab, accessToken, apptFilter, fetchRules, fetchBlocks, fetchAppointments]);

  // ── School calendar CRUD ──────────────────────────────────────────────────

  function openNewSchoolEventForm() {
    setEditingSchoolEvent(null);
    setSchoolForm({
      title: "",
      description: "",
      startsAt: format(new Date(), "yyyy-MM-dd"),
      endsAt: format(new Date(), "yyyy-MM-dd"),
      notifyParents: false,
      notifyDayOf: false,
    });
    setSchoolFormError(null);
    setShowSchoolForm(true);
  }

  function openEditSchoolEventForm(ev: typeof schoolEvents[number]) {
    setEditingSchoolEvent(ev);
    setSchoolForm({
      title: ev.title,
      description: ev.description ?? "",
      startsAt: format(new Date(ev.starts_at), "yyyy-MM-dd"),
      endsAt: format(new Date(ev.ends_at), "yyyy-MM-dd"),
      notifyParents: false,
      notifyDayOf: false,
    });
    setSchoolFormError(null);
    setShowSchoolForm(true);
  }

  async function handleSaveSchoolEvent() {
    if (!accessToken) return;
    setSavingSchool(true);
    setSchoolFormError(null);
    const starts_at = `${schoolForm.startsAt}T00:00:00`;
    const ends_at = `${schoolForm.endsAt}T23:59:59`;

    const url = editingSchoolEvent
      ? `/api/school-calendar/events/${editingSchoolEvent.id}`
      : "/api/school-calendar/events";
    const method = editingSchoolEvent ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          title: schoolForm.title,
          description: schoolForm.description || null,
          starts_at,
          ends_at,
          ...(editingSchoolEvent
            ? {}
            : { notify_parents: schoolForm.notifyParents, notify_day_of: schoolForm.notifyDayOf }),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setShowSchoolForm(false);
        // Re-fetch the current visible range.
        if (accessToken && schoolFrom && schoolTo) {
          fetchSchoolEvents(accessToken, schoolFrom, schoolTo);
        }
      } else {
        setSchoolFormError(labels.schoolCalendar.form.createError);
      }
    } catch {
      setSchoolFormError(labels.schoolCalendar.form.createError);
    }
    setSavingSchool(false);
  }

  async function handleDeleteSchoolEvent(id: string) {
    if (!accessToken || !window.confirm(labels.schoolCalendar.form.deleteConfirm)) return;
    setDeletingSchoolId(id);
    const res = await fetch(`/api/school-calendar/events/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.ok) {
      setSchoolEvents((prev) => prev.filter((e) => e.id !== id));
      if (showSchoolForm && editingSchoolEvent?.id === id) setShowSchoolForm(false);
    } else {
      setSchoolFormError(labels.schoolCalendar.form.deleteError);
    }
    setDeletingSchoolId(null);
  }

  async function handleAddRule() {
    if (!accessToken || !activeCalendar) return;
    setSavingRule(true);
    setRuleError(null);
    const res = await fetch("/api/staff/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        calendarType: activeCalendar.calendar_type,
        weekday: parseInt(ruleForm.weekday),
        startTime: ruleForm.startTime,
        endTime: ruleForm.endTime,
        slotMinutes: parseInt(ruleForm.slotMinutes),
        effectiveFrom: ruleForm.effectiveFrom,
        effectiveTo: ruleForm.effectiveTo || null,
      }),
    });
    const data = await res.json();
    setSavingRule(false);
    if (!data.ok) { setRuleError(labels.availability.createError); return; }
    setShowAddRule(false);
    fetchRules(activeCalendar.calendar_type, accessToken);
  }

  async function handleDeleteRule(ruleId: string) {
    if (!accessToken) return;
    setDeletingRuleId(ruleId);
    const res = await fetch(`/api/staff/availability/${ruleId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setDeletingRuleId(null);
    if (!data.ok) { setRuleError(labels.availability.deleteError); return; }
    if (activeCalendar) fetchRules(activeCalendar.calendar_type, accessToken);
  }

  async function handleAddBlock() {
    if (!accessToken || !activeCalendar) return;
    setSavingBlock(true);
    setBlockError(null);
    const res = await fetch("/api/staff/calendar-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        calendarType: activeCalendar.calendar_type,
        startsAt: new Date(blockForm.startsAt).toISOString(),
        endsAt: new Date(blockForm.endsAt).toISOString(),
        reason: blockForm.reason || undefined,
      }),
    });
    const data = await res.json();
    setSavingBlock(false);
    if (!data.ok) { setBlockError(labels.blocks.createError); return; }
    setShowAddBlock(false);
    setBlockForm({ startsAt: "", endsAt: "", reason: "" });
    fetchBlocks(activeCalendar.calendar_type, accessToken);
  }

  async function handleDeleteBlock(blockId: string) {
    if (!accessToken) return;
    setDeletingBlockId(blockId);
    const res = await fetch(`/api/staff/calendar-blocks/${blockId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    setDeletingBlockId(null);
    if (!data.ok) { setBlockError(labels.blocks.deleteError); return; }
    if (activeCalendar) fetchBlocks(activeCalendar.calendar_type, accessToken);
  }

  async function handleAppointmentAction(apptId: string, action: string) {
    if (!accessToken) return;
    setProcessingApptId(apptId);
    setApptActionError(null);
    const res = await fetch(`/api/appointments/${apptId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    setProcessingApptId(null);
    if (!data.ok) { setApptActionError(labels.appointments.actionError); return; }
    if (activeCalendar) fetchAppointments(activeCalendar.calendar_type, accessToken, apptFilter);
  }

  async function handleSaveNote(apptId: string) {
    if (!accessToken || !noteForm.body.trim()) return;
    setSavingNote(true);
    setNoteError(null);
    const res = await fetch(`/api/appointments/${apptId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        noteBody: noteForm.body,
        outcome: noteForm.outcome || undefined,
        includeInStudentRecord: noteForm.includeInRecord,
      }),
    });
    const data = await res.json();
    setSavingNote(false);
    if (!data.ok) { setNoteError(labels.appointments.noteError); return; }
    setNoteFormId(null);
    setNoteForm({ body: "", outcome: "", includeInRecord: false });
  }

  const STATUS_COLORS: Record<string, string> = {
    requested: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    canceled: "bg-gray-100 text-gray-600",
    no_show: "bg-red-100 text-red-700",
  };

  const STATUS_LABELS: Record<string, string> = {
    requested: labels.appointments.requested,
    confirmed: labels.appointments.confirmed,
    completed: labels.appointments.completed,
    canceled: labels.appointments.canceled,
    no_show: labels.appointments.noShow,
  };

  if (loadingInit) {
    return (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-8 flex flex-col items-center gap-3 text-[#2b5876]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#eef4fa] border-t-[#2b5876]" />
        <span className="text-sm">{labels.loading}</span>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-6 text-[#fa4361]">
        {initError}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-[#60A5FA]" />
          <div>
            <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">
              {labels.title}
            </h1>
            <p className="mt-1 text-sm text-[#2b5876]">{labels.subtitle}</p>
          </div>
        </div>

        {/* Calendar selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {calendars.map((cal) => (
            <button
              key={cal.id}
              onClick={() => setActiveCalendar(cal)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                activeCalendar?.id === cal.id
                  ? "bg-[#003F60] text-white"
                  : "bg-[#f0f8ff] text-[#003F60] hover:bg-[#d6e8f6]"
              }`}
            >
              {cal.title}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs — only shown for appointment calendars; school calendar has its own layout */}
      {activeCalendar?.calendar_type === "school_events" ? (
        <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
          {/* ── School Calendar (Escolar pill selected) ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#003F60]">{labels.tabs.school}</h2>
              {canManageSchool && !showSchoolForm && (
                <button
                  onClick={openNewSchoolEventForm}
                  className="flex items-center gap-1.5 rounded-lg bg-[#003F60] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#00527a]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {labels.schoolCalendar.addEvent}
                </button>
              )}
            </div>
            {showSchoolForm && (
              <div className="rounded-xl border border-[#d6e8f6] bg-[#f0f8ff] p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#003F60]">
                  {editingSchoolEvent ? labels.schoolCalendar.form.editHeading : labels.schoolCalendar.form.newHeading}
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#2b5876]">{labels.schoolCalendar.form.title}</label>
                    <input type="text" value={schoolForm.title} onChange={(e) => setSchoolForm((f) => ({ ...f, title: e.target.value }))} placeholder={labels.schoolCalendar.form.titlePlaceholder} className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2b5876]">{labels.schoolCalendar.form.startsAt}</label>
                    <input type="date" value={schoolForm.startsAt} onChange={(e) => setSchoolForm((f) => ({ ...f, startsAt: e.target.value }))} className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[#2b5876]">{labels.schoolCalendar.form.endsAt}</label>
                    <input type="date" value={schoolForm.endsAt} onChange={(e) => setSchoolForm((f) => ({ ...f, endsAt: e.target.value }))} className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-[#2b5876]">{labels.schoolCalendar.form.description}</label>
                    <textarea rows={2} value={schoolForm.description} onChange={(e) => setSchoolForm((f) => ({ ...f, description: e.target.value }))} placeholder={labels.schoolCalendar.form.descriptionPlaceholder} className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:outline-none focus:ring-2 focus:ring-[#60A5FA]" />
                  </div>
                </div>
                {!editingSchoolEvent && (
                  <div className="space-y-2 rounded-lg border border-[#d6e8f6] bg-white p-3">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={schoolForm.notifyParents}
                        onChange={(e) => setSchoolForm((f) => ({ ...f, notifyParents: e.target.checked }))}
                        className="h-4 w-4 rounded border-[#d6e8f6] accent-[#003F60]"
                      />
                      <span className="text-xs font-medium text-[#003F60]">{labels.schoolCalendar.form.notifyParents}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={schoolForm.notifyDayOf}
                        onChange={(e) => setSchoolForm((f) => ({ ...f, notifyDayOf: e.target.checked }))}
                        className="h-4 w-4 rounded border-[#d6e8f6] accent-[#003F60]"
                      />
                      <span className="text-xs font-medium text-[#003F60]">{labels.schoolCalendar.form.notifyDayOf}</span>
                    </label>
                  </div>
                )}
                {schoolFormError && <p className="text-xs text-[#fa4361]">{schoolFormError}</p>}
                <div className="flex gap-2">
                  <button onClick={handleSaveSchoolEvent} disabled={savingSchool || !schoolForm.title.trim()} className="rounded-lg bg-[#003F60] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#00527a] disabled:opacity-50">
                    {savingSchool ? labels.schoolCalendar.form.saving : labels.schoolCalendar.form.save}
                  </button>
                  {editingSchoolEvent && (
                    <button onClick={() => handleDeleteSchoolEvent(editingSchoolEvent.id)} disabled={deletingSchoolId === editingSchoolEvent.id} className="rounded-lg border border-[#fa4361] px-4 py-1.5 text-xs font-medium text-[#fa4361] hover:bg-red-50 disabled:opacity-50">
                      {labels.schoolCalendar.form.deleteButton}
                    </button>
                  )}
                  <button onClick={() => setShowSchoolForm(false)} className="rounded-lg border border-[#d6e8f6] px-4 py-1.5 text-xs font-medium text-[#2b5876] hover:bg-white">
                    {labels.schoolCalendar.form.cancel}
                  </button>
                </div>
              </div>
            )}
            {schoolError ? (
              <p className="text-sm text-[#fa4361]">{schoolError}</p>
            ) : (
              <AppCalendarGrid
                events={schoolEvents.map((e) => ({ id: e.id, title: e.title, description: e.description ?? undefined, startsAt: new Date(e.starts_at), endsAt: new Date(e.ends_at), status: e.event_type, allDay: e.is_birthday, role: e.role }))}
                loading={loadingSchool}
                onRangeChange={handleSchoolRangeChange}
                onEventClick={(id) => {
                  if (!canManageSchool) return;
                  const ev = schoolEvents.find((e) => e.id === id);
                  if (ev && !ev.is_birthday) openEditSchoolEventForm(ev);
                }}
                labels={{ ...labels.calendarGrid, statusLabels: labels.schoolCalendar.eventType }}
              />
            )}
          </div>
        </div>
      ) : (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white">
        <div className="flex border-b border-[#d6e8f6]">
          {(["calendar", "appointments", "availability", "blocks"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-[#60A5FA] text-[#003F60]"
                  : "text-[#2b5876] hover:text-[#003F60]"
              }`}
            >
              {labels.tabs[tab]}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-6">
          {/* ── Calendar Tab ── */}
          {activeTab === "calendar" && (
            <AppCalendarGrid
              events={calendarEvents}
              loading={loadingCalendar}
              onRangeChange={handleRangeChange}
              onEventClick={(id) => {
                setActiveTab("appointments");
                setExpandedApptId(id);
                setApptFilter("all");
              }}
              labels={labels.calendarGrid}
            />
          )}

          {/* ── Appointments Tab ── */}
          {activeTab === "appointments" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-[#003F60]">
                  {labels.appointments.heading}
                </h2>
                <div className="flex gap-2">
                  {(["all", "requested", "confirmed", "completed"] as AppointmentFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setApptFilter(f)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        apptFilter === f
                          ? "bg-[#003F60] text-white"
                          : "bg-[#f0f8ff] text-[#003F60] hover:bg-[#d6e8f6]"
                      }`}
                    >
                      {labels.appointments[
                        f === "all"
                          ? "filterAll"
                          : f === "requested"
                          ? "filterPending"
                          : f === "confirmed"
                          ? "filterConfirmed"
                          : "filterCompleted"
                      ]}
                    </button>
                  ))}
                </div>
              </div>

              {apptActionError && (
                <p className="text-sm text-[#fa4361]">{apptActionError}</p>
              )}

              {loadingAppts ? (
                <div className="flex items-center gap-2 py-2 text-sm text-[#2b5876]">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#eef4fa] border-t-[#2b5876]" />
                  {labels.loading}
                </div>
              ) : appointments.length === 0 ? (
                <p className="text-sm text-[#2b5876]">{labels.appointments.empty}</p>
              ) : (
                <ul className="space-y-3">
                  {appointments.map((appt) => (
                    <li
                      key={appt.id}
                      className="rounded-xl border border-[#d6e8f6] p-4 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {STATUS_LABELS[appt.status] ?? appt.status}
                            </span>
                            <span className="text-[#003F60] font-medium">
                              {format(new Date(appt.starts_at), "dd MMM yyyy, HH:mm")}
                              {" – "}
                              {format(new Date(appt.ends_at), "HH:mm")}
                            </span>
                          </div>
                          {appt.requester_profile && (
                            <p className="text-[#2b5876]">
                              {appt.requester_profile.full_name} · {appt.requester_profile.email}
                            </p>
                          )}
                          {appt.reason && (
                            <p className="text-[#2b5876]">
                              <span className="font-medium">{labels.appointments.requesterNote}:</span>{" "}
                              {appt.reason}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            setExpandedApptId(expandedApptId === appt.id ? null : appt.id)
                          }
                          className="text-[#2b5876] hover:text-[#003F60]"
                          aria-label="Toggle actions"
                        >
                          {expandedApptId === appt.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {expandedApptId === appt.id && !isReadOnly && (
                        <div className="mt-3 space-y-3 border-t border-[#d6e8f6] pt-3">
                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2">
                            {appt.status === "requested" && (
                              <>
                                <button
                                  onClick={() => handleAppointmentAction(appt.id, "approve")}
                                  disabled={processingApptId === appt.id}
                                  className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
                                >
                                  {labels.appointments.approveButton}
                                </button>
                                <button
                                  onClick={() => handleAppointmentAction(appt.id, "reject")}
                                  disabled={processingApptId === appt.id}
                                  className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
                                >
                                  {labels.appointments.rejectButton}
                                </button>
                              </>
                            )}
                            {appt.status === "confirmed" && (
                              <>
                                <button
                                  onClick={() => handleAppointmentAction(appt.id, "complete")}
                                  disabled={processingApptId === appt.id}
                                  className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-200 disabled:opacity-50"
                                >
                                  {labels.appointments.completeButton}
                                </button>
                                <button
                                  onClick={() => handleAppointmentAction(appt.id, "no_show")}
                                  disabled={processingApptId === appt.id}
                                  className="rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-200 disabled:opacity-50"
                                >
                                  {labels.appointments.noShowButton}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() =>
                                setNoteFormId(noteFormId === appt.id ? null : appt.id)
                              }
                              className="rounded-lg bg-[#f0f8ff] px-3 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#d6e8f6]"
                            >
                              {labels.appointments.addNoteButton}
                            </button>
                          </div>

                          {/* Resolution note form */}
                          {noteFormId === appt.id && (
                            <div className="rounded-xl border border-[#d6e8f6] bg-[#f5fbff] p-4 space-y-3">
                              <textarea
                                value={noteForm.body}
                                onChange={(e) =>
                                  setNoteForm((n) => ({ ...n, body: e.target.value }))
                                }
                                placeholder={labels.appointments.noteBodyPlaceholder}
                                rows={3}
                                className="w-full rounded-lg border border-[#d6e8f6] bg-white p-2 text-sm text-[#003F60] focus:outline-none focus:ring-1 focus:ring-[#60A5FA]"
                              />
                              <div className="flex flex-wrap gap-4 items-center">
                                <select
                                  value={noteForm.outcome}
                                  onChange={(e) =>
                                    setNoteForm((n) => ({ ...n, outcome: e.target.value }))
                                  }
                                  className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60] focus:outline-none"
                                >
                                  <option value="">{labels.appointments.outcome}</option>
                                  {["completed", "no_show", "rescheduled", "canceled", "note"].map(
                                    (o) => (
                                      <option key={o} value={o}>
                                        {o}
                                      </option>
                                    )
                                  )}
                                </select>
                                {appt.student_id && (
                                  <label className="flex items-center gap-2 text-sm text-[#003F60]">
                                    <input
                                      type="checkbox"
                                      checked={noteForm.includeInRecord}
                                      onChange={(e) =>
                                        setNoteForm((n) => ({
                                          ...n,
                                          includeInRecord: e.target.checked,
                                        }))
                                      }
                                      className="rounded"
                                    />
                                    {labels.appointments.includeInRecord}
                                  </label>
                                )}
                              </div>
                              {noteError && (
                                <p className="text-xs text-[#fa4361]">{noteError}</p>
                              )}
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNote(appt.id)}
                                  disabled={savingNote || !noteForm.body.trim()}
                                  className="rounded-lg bg-[#003F60] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#002d47] disabled:opacity-50"
                                >
                                  {savingNote
                                    ? labels.appointments.savingNote
                                    : labels.appointments.saveNote}
                                </button>
                                <button
                                  onClick={() => setNoteFormId(null)}
                                  className="rounded-lg bg-[#f0f8ff] px-4 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#d6e8f6]"
                                >
                                  {labels.appointments.cancelNote}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Availability Tab ── */}
          {activeTab === "availability" && !isReadOnly && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#003F60]">
                  {labels.availability.heading}
                </h2>
                <button
                  onClick={() => setShowAddRule((s) => !s)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#003F60] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#002d47]"
                >
                  {showAddRule ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {labels.availability.addButton}
                </button>
              </div>

              {showAddRule && (
                <div className="rounded-xl border border-[#d6e8f6] bg-[#f5fbff] p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.weekday}
                      <select
                        value={ruleForm.weekday}
                        onChange={(e) => setRuleForm((f) => ({ ...f, weekday: e.target.value }))}
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      >
                        {WEEKDAY_KEYS.map((d) => (
                          <option key={d} value={String(d)}>
                            {labels.availability.weekdays[d]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.slotDuration}
                      <select
                        value={ruleForm.slotMinutes}
                        onChange={(e) => setRuleForm((f) => ({ ...f, slotMinutes: e.target.value }))}
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      >
                        <option value="30">{labels.availability.slotDuration30}</option>
                        <option value="60">{labels.availability.slotDuration60}</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.startTime}
                      <input
                        type="time"
                        value={ruleForm.startTime}
                        onChange={(e) => setRuleForm((f) => ({ ...f, startTime: e.target.value }))}
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.endTime}
                      <input
                        type="time"
                        value={ruleForm.endTime}
                        onChange={(e) => setRuleForm((f) => ({ ...f, endTime: e.target.value }))}
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.effectiveFrom}
                      <input
                        type="date"
                        value={ruleForm.effectiveFrom}
                        onChange={(e) =>
                          setRuleForm((f) => ({ ...f, effectiveFrom: e.target.value }))
                        }
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.availability.effectiveTo}{" "}
                      <span className="text-xs text-[#2b5876] opacity-60">
                        {labels.availability.effectiveToOptional}
                      </span>
                      <input
                        type="date"
                        value={ruleForm.effectiveTo}
                        onChange={(e) =>
                          setRuleForm((f) => ({ ...f, effectiveTo: e.target.value }))
                        }
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                  </div>
                  {ruleError && <p className="text-xs text-[#fa4361]">{ruleError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRule}
                      disabled={savingRule}
                      className="rounded-lg bg-[#003F60] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#002d47] disabled:opacity-50"
                    >
                      {savingRule ? labels.availability.saving : labels.availability.save}
                    </button>
                    <button
                      onClick={() => setShowAddRule(false)}
                      className="rounded-lg bg-[#f0f8ff] px-4 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#d6e8f6]"
                    >
                      {labels.availability.cancel}
                    </button>
                  </div>
                </div>
              )}

              {rules.length === 0 ? (
                <p className="text-sm text-[#2b5876]">{labels.availability.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {rules.map((rule) => (
                    <li
                      key={rule.id}
                      className="flex items-center justify-between rounded-xl border border-[#d6e8f6] p-3 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-[#60A5FA]" />
                        <span className="font-medium text-[#003F60]">
                          {labels.availability.weekdays[rule.weekday]}
                        </span>
                        <span className="text-[#2b5876]">
                          {rule.start_time.slice(0, 5)} – {rule.end_time.slice(0, 5)}
                        </span>
                        <span className="rounded-full bg-[#f0f8ff] px-2 py-0.5 text-xs text-[#003F60]">
                          {rule.slot_minutes} min
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deletingRuleId === rule.id}
                        className="rounded-lg p-1.5 text-[#fa4361] hover:bg-red-50 disabled:opacity-50"
                        aria-label={labels.availability.deleteButton}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ── Blocks Tab ── */}
          {activeTab === "blocks" && !isReadOnly && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#003F60]">
                  {labels.blocks.heading}
                </h2>
                <button
                  onClick={() => setShowAddBlock((s) => !s)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#003F60] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#002d47]"
                >
                  {showAddBlock ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {labels.blocks.addButton}
                </button>
              </div>

              {showAddBlock && (
                <div className="rounded-xl border border-[#d6e8f6] bg-[#f5fbff] p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.blocks.startsAt}
                      <input
                        type="datetime-local"
                        value={blockForm.startsAt}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, startsAt: e.target.value }))
                        }
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                      {labels.blocks.endsAt}
                      <input
                        type="datetime-local"
                        value={blockForm.endsAt}
                        onChange={(e) =>
                          setBlockForm((f) => ({ ...f, endsAt: e.target.value }))
                        }
                        className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                      />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-xs text-[#2b5876]">
                    {labels.blocks.reason}
                    <input
                      type="text"
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                      placeholder={labels.blocks.reasonPlaceholder}
                      className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-sm text-[#003F60]"
                    />
                  </label>
                  {blockError && <p className="text-xs text-[#fa4361]">{blockError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddBlock}
                      disabled={savingBlock || !blockForm.startsAt || !blockForm.endsAt}
                      className="rounded-lg bg-[#003F60] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#002d47] disabled:opacity-50"
                    >
                      {savingBlock ? labels.blocks.saving : labels.blocks.save}
                    </button>
                    <button
                      onClick={() => setShowAddBlock(false)}
                      className="rounded-lg bg-[#f0f8ff] px-4 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#d6e8f6]"
                    >
                      {labels.blocks.cancel}
                    </button>
                  </div>
                </div>
              )}

              {blocks.length === 0 ? (
                <p className="text-sm text-[#2b5876]">{labels.blocks.empty}</p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map((block) => (
                    <li
                      key={block.id}
                      className="flex items-center justify-between rounded-xl border border-[#d6e8f6] p-3 text-sm"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium text-[#003F60]">
                          {format(new Date(block.starts_at), "dd MMM yyyy, HH:mm")}
                          {" – "}
                          {format(new Date(block.ends_at), "dd MMM yyyy, HH:mm")}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-[#2b5876]">{block.reason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        disabled={deletingBlockId === block.id}
                        className="rounded-lg p-1.5 text-[#fa4361] hover:bg-red-50 disabled:opacity-50"
                        aria-label={labels.blocks.deleteButton}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
