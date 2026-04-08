"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CalendarDays, Eye } from "lucide-react";

type CalendarType =
  | "coordination_appointments"
  | "direction_appointments"
  | "clerk_appointments";

interface AppointmentRow {
  id: string;
  status: string;
  requested_by_role: string;
  reason: string | null;
  starts_at: string;
  ends_at: string;
  requester_profile: { full_name: string; email: string } | null;
  calendars: { calendar_type: string } | null;
}

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  calendarTypes: Record<string, string>;
  appointments: {
    empty: string;
    requested: string;
    confirmed: string;
    completed: string;
    canceled: string;
    noShow: string;
    requesterNote: string;
  };
}

interface SuperadminCalendarViewProps {
  labels: Labels;
}

const ALL_CALENDAR_TYPES: CalendarType[] = [
  "coordination_appointments",
  "direction_appointments",
  "clerk_appointments",
];

export function SuperadminCalendarView({ labels }: SuperadminCalendarViewProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCalType, setSelectedCalType] = useState<CalendarType>(
    "coordination_appointments"
  );
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

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

  const fetchAppointments = useCallback(
    async (calType: CalendarType, token: string) => {
      setLoadingAppts(true);
      const res = await fetch(`/api/staff/appointments?calendarType=${calType}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAppointments(data.ok ? data.appointments : []);
      setLoadingAppts(false);
    },
    []
  );

  useEffect(() => {
    if (!accessToken) return;
    fetchAppointments(selectedCalType, accessToken);
  }, [accessToken, selectedCalType, fetchAppointments]);

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
          <CalendarDays className="h-6 w-6 text-[#E5E4E2]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">
                {labels.title}
              </h1>
              <span className="flex items-center gap-1 rounded-full border border-[#d6e8f6] px-2 py-0.5 text-xs text-[#2b5876]">
                <Eye className="h-3 w-3" />
                Read-only
              </span>
            </div>
            <p className="mt-1 text-sm text-[#2b5876]">{labels.subtitle}</p>
          </div>
        </div>

        {/* Calendar type tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {ALL_CALENDAR_TYPES.map((cal) => (
            <button
              key={cal}
              onClick={() => setSelectedCalType(cal)}
              className={`rounded-full px-4 py-1 text-sm font-medium transition-colors ${
                selectedCalType === cal
                  ? "bg-[#003F60] text-white"
                  : "bg-[#f0f8ff] text-[#003F60] hover:bg-[#d6e8f6]"
              }`}
            >
              {labels.calendarTypes[cal] ?? cal}
            </button>
          ))}
        </div>
      </div>

      {/* Appointment list (read-only) */}
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
        {loadingAppts ? (
          <p className="text-sm text-[#2b5876]">{labels.loading}</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-[#2b5876]">{labels.appointments.empty}</p>
        ) : (
          <ul className="space-y-3">
            {appointments.map((appt) => (
              <li
                key={appt.id}
                className="rounded-xl border border-[#d6e8f6] p-4 text-sm space-y-1"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[appt.status] ?? appt.status}
                  </span>
                  <span className="font-medium text-[#003F60]">
                    {format(new Date(appt.starts_at), "dd MMM yyyy, HH:mm")}
                    {" – "}
                    {format(new Date(appt.ends_at), "HH:mm")}
                  </span>
                  <span className="text-xs text-[#2b5876] capitalize">
                    {appt.requested_by_role}
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
