"use client";

import { useEffect, useCallback } from "react";
import { useState } from "react";
import { format } from "date-fns";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { CalendarDays } from "lucide-react";
import { AppCalendarGrid, type CalendarEvent, type AppCalendarGridLabels } from "@/components/ui/AppCalendarGrid";

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

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  calendarGrid: AppCalendarGridLabels;
  eventType: Record<string, string>;
}

interface ParentSchoolCalendarPageProps {
  labels: Labels;
}

export function ParentSchoolCalendarPage({ labels }: ParentSchoolCalendarPageProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setInitError(labels.error);
        setLoadingInit(false);
        return;
      }
      setAccessToken(session.access_token);
      setLoadingInit(false);
    }
    init();
  }, [labels.error]);

  const fetchEvents = useCallback(
    async (token: string, from: Date, to: Date) => {
      setLoadingEvents(true);
      try {
        const res = await fetch(
          `/api/school-calendar/events?from=${format(from, "yyyy-MM-dd")}&to=${format(to, "yyyy-MM-dd")}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.ok) setEvents(data.events ?? []);
        else setInitError(labels.error);
      } catch {
        setInitError(labels.error);
      }
      setLoadingEvents(false);
    },
    [labels.error]
  );

  const handleRangeChange = useCallback(
    (from: Date, to: Date) => {
      if (!accessToken) return;
      fetchEvents(accessToken, from, to);
    },
    [accessToken, fetchEvents]
  );

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

  const calendarEvents: CalendarEvent[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? undefined,
    startsAt: new Date(e.starts_at),
    endsAt: new Date(e.ends_at),
    status: e.event_type,
    allDay: e.is_birthday,
    role: e.role,
  }));

  return (
    <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-[#60A5FA]" />
        <div>
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">
            {labels.title}
          </h1>
          <p className="mt-1 text-sm text-[#2b5876]">{labels.subtitle}</p>
        </div>
      </div>

      {/* Calendar */}
      <AppCalendarGrid
        events={calendarEvents}
        loading={loadingEvents}
        onRangeChange={handleRangeChange}
        labels={{
          ...labels.calendarGrid,
          statusLabels: labels.eventType,
        }}
      />
    </div>
  );
}
