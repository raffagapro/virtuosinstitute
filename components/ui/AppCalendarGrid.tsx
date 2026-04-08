"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Cake, Crown, Building2, BriefcaseBusiness, GraduationCap, ClipboardList, BookOpen, type LucideIcon } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 60; // px per hour in week view
const VISIBLE_START = 7;
const VISIBLE_END = 20;
const TOTAL_HOURS = VISIBLE_END - VISIBLE_START;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  allDay?: boolean;
  role?: string;
  description?: string;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ children, lines }: { children: React.ReactNode; lines: string[] }) {
  if (!lines.length) return <>{children}</>;
  return (
    <div className="group/tip relative">
      {children}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100">
        <div className="min-w-[140px] max-w-[220px] rounded-lg border border-[#d6e8f6] bg-white px-2.5 py-2 shadow-lg">
          {lines.map((l, i) => l ? (
            <p key={i} className={`leading-snug ${i === 0 ? "text-[11px] font-semibold text-[#003F60]" : "mt-0.5 text-[10px] text-[#2b5876]"}`}>{l}</p>
          ) : null)}
        </div>
        <div className="mx-auto -mt-px h-2 w-2 rotate-45 border-b border-r border-[#d6e8f6] bg-white" />
      </div>
    </div>
  );
}

export interface AppCalendarGridLabels {
  viewMonth: string;
  viewWeek: string;
  today: string;
  /** 7-element array indexed by Date.getDay() (0 = Sunday … 6 = Saturday) */
  weekdaysShort: string[];
  statusLabels: Record<string, string>;
  /** Optional role display names used in birthday tooltips. */
  roleLabels?: Record<string, string>;
}

export interface AppCalendarGridProps {
  events: CalendarEvent[];
  loading?: boolean;
  onEventClick?: (eventId: string) => void;
  /** Called whenever the visible range changes so the parent can fetch data. */
  onRangeChange: (from: Date, to: Date) => void;
  labels: AppCalendarGridLabels;
}

type ViewMode = "month" | "week";

// ─── Status colour maps ───────────────────────────────────────────────────────

const PILL_COLORS: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  confirmed:  "bg-blue-100 text-blue-800",
  completed:  "bg-green-100 text-green-800",
  canceled:   "bg-gray-100 text-gray-500",
  no_show:    "bg-red-100 text-red-700",
  school_event: "bg-indigo-100 text-indigo-700",
};

const BLOCK_COLORS: Record<string, string> = {
  requested: "border-l-2 border-amber-400 bg-amber-50 text-amber-800",
  confirmed:  "border-l-2 border-blue-400 bg-blue-50 text-blue-800",
  completed:  "border-l-2 border-green-400 bg-green-50 text-green-800",
  canceled:   "border-l-2 border-gray-300 bg-gray-50 text-gray-500",
  no_show:    "border-l-2 border-red-400 bg-red-50 text-red-700",
  school_event: "border-l-2 border-indigo-400 bg-indigo-50 text-indigo-700",
};

// Role-based colors for birthday events (matches the app’s role color palette).
const BIRTHDAY_ROLE_PILL_COLORS: Record<string, string> = {
  school_owner: "bg-[#D4AF37] text-[#003F60]",
  direction:    "bg-[#C084FC] text-white",
  coordination: "bg-[#60A5FA] text-white",
  teacher:      "bg-[#34D399] text-[#003F60]",
  clerk:        "bg-[#22D3EE] text-[#003F60]",
  student:      "bg-[#36e7e1] text-[#003F60]",
};

const BIRTHDAY_ROLE_ICONS: Record<string, LucideIcon> = {
  school_owner: Crown,
  direction:    Building2,
  coordination: BriefcaseBusiness,
  teacher:      GraduationCap,
  clerk:        ClipboardList,
  student:      BookOpen,
};

// ─── Range helper ─────────────────────────────────────────────────────────────

function getRange(date: Date, mode: ViewMode): { from: Date; to: Date } {
  if (mode === "month") {
    return { from: startOfMonth(date), to: endOfMonth(date) };
  }
  return {
    from: startOfWeek(date, { weekStartsOn: 1 }),
    to: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppCalendarGrid({
  events,
  loading = false,
  onEventClick,
  onRangeChange,
  labels,
}: AppCalendarGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Keep a stable ref to the callback to avoid re-triggering the effect when
  // the parent passes a new function reference on every render.
  const onRangeChangeRef = useRef(onRangeChange);
  useEffect(() => { onRangeChangeRef.current = onRangeChange; });

  useEffect(() => {
    const { from, to } = getRange(currentDate, viewMode);
    onRangeChangeRef.current(from, to);
  }, [currentDate, viewMode]);

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const headerLabel =
    viewMode === "month"
      ? format(currentDate, "MMMM yyyy")
      : `${format(weekDays[0], "d MMM")} – ${format(weekDays[6], "d MMM yyyy")}`;

  function prev() {
    setCurrentDate((d) => (viewMode === "month" ? subMonths(d, 1) : subWeeks(d, 1)));
  }
  function next() {
    setCurrentDate((d) => (viewMode === "month" ? addMonths(d, 1) : addWeeks(d, 1)));
  }
  function goToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* View toggle */}
        <div className="flex overflow-hidden rounded-lg border border-[#d6e8f6]">
          {(["month", "week"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                viewMode === mode
                  ? "bg-[#003F60] text-white"
                  : "bg-white text-[#2b5876] hover:bg-[#f0f8ff]"
              }`}
            >
              {mode === "month" ? labels.viewMonth : labels.viewWeek}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToday}
            className="rounded-lg border border-[#d6e8f6] bg-white px-3 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#f0f8ff]"
          >
            {labels.today}
          </button>
          <button
            onClick={prev}
            className="rounded-lg border border-[#d6e8f6] bg-white p-1.5 text-[#003F60] hover:bg-[#f0f8ff]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[180px] text-center text-sm font-semibold capitalize text-[#003F60]">
            {headerLabel}
          </span>
          <button
            onClick={next}
            className="rounded-lg border border-[#d6e8f6] bg-white p-1.5 text-[#003F60] hover:bg-[#f0f8ff]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-[#d6e8f6] bg-white">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#eef4fa] border-t-[#2b5876]" />
        </div>
      ) : viewMode === "month" ? (
        <MonthGrid
          currentDate={currentDate}
          events={events}
          labels={labels}
          onEventClick={onEventClick}
          onDayNavigate={(day) => {
            setCurrentDate(day);
            setViewMode("week");
          }}
        />
      ) : (
        <WeekGrid
          weekDays={weekDays}
          events={events}
          labels={labels}
          onEventClick={onEventClick}
        />
      )}
    </div>
  );
}

// ─── Month grid ───────────────────────────────────────────────────────────────

interface MonthGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  labels: AppCalendarGridLabels;
  onEventClick?: (id: string) => void;
  onDayNavigate: (day: Date) => void;
}

/** Mon–Sun order: indices into Date.getDay() */
const MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

function MonthGrid({ currentDate, events, labels, onEventClick, onDayNavigate }: MonthGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-hidden rounded-xl border border-[#d6e8f6] bg-white">
      {/* Weekday header (Mon … Sun) */}
      <div className="grid grid-cols-7 border-b border-[#d6e8f6]">
        {MON_FIRST.map((idx) => (
          <div
            key={idx}
            className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-[#2b5876]"
          >
            {labels.weekdaysShort[idx]}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          const dayEvents = events.filter((e) =>
            e.allDay
              ? isSameDay(e.startsAt, day)
              : e.startsAt <= dayEnd && e.endsAt >= dayStart
          );
          const isCurrentMonth = isSameMonth(day, currentDate);
          const todayDay = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayNavigate(day)}
              className={`group min-h-[88px] cursor-pointer border-b border-r border-[#d6e8f6] p-1 text-left last:border-r-0 hover:bg-[#f5fbff] ${
                !isCurrentMonth ? "opacity-40" : ""
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  todayDay
                    ? "bg-[#003F60] text-white"
                    : "text-[#003F60]"
                }`}
              >
                {format(day, "d")}
              </span>

              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const RoleIcon = ev.allDay && ev.role ? BIRTHDAY_ROLE_ICONS[ev.role] : undefined;
                  const pillColor = ev.allDay
                    ? (ev.role ? BIRTHDAY_ROLE_PILL_COLORS[ev.role] : undefined) ?? "bg-pink-100 text-pink-700"
                    : PILL_COLORS[ev.status] ?? "bg-gray-100 text-gray-600";
                  const tooltipLines = ev.allDay
                    ? [ev.title, labels.roleLabels?.[ev.role ?? ""] ?? "", format(ev.startsAt, "d MMM")].filter(Boolean) as string[]
                    : isSameDay(ev.startsAt, ev.endsAt)
                      ? [ev.title, format(ev.startsAt, "d MMM"), ev.description ?? ""].filter(Boolean) as string[]
                      : [ev.title, `${format(ev.startsAt, "d MMM")} – ${format(ev.endsAt, "d MMM")}`, ev.description ?? ""].filter(Boolean) as string[];
                  return (
                  <Tooltip key={ev.id} lines={tooltipLines}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(ev.id);
                    }}
                    className={`truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer ${pillColor}`}
                  >
                    {ev.allDay && (
                      <>
                        <Cake className="mr-0.5 inline h-2.5 w-2.5 shrink-0" />
                        {RoleIcon && <RoleIcon className="mr-0.5 inline h-2.5 w-2.5 shrink-0" />}
                      </>
                    )}{!ev.allDay && `${format(ev.startsAt, "HH:mm")} `}{ev.title}
                  </div>
                  </Tooltip>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="pl-1 text-[10px] text-[#2b5876]">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Week grid ────────────────────────────────────────────────────────────────

interface WeekGridProps {
  weekDays: Date[];
  events: CalendarEvent[];
  labels: AppCalendarGridLabels;
  onEventClick?: (id: string) => void;
}

const HOUR_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) => {
  const h = VISIBLE_START + i;
  return `${String(h).padStart(2, "0")}:00`;
});

function WeekGrid({ weekDays, events, labels, onEventClick }: WeekGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d6e8f6] bg-white">
      {/* Header row: day names */}
      <div className="flex border-b border-[#d6e8f6]">
        {/* gutter for time labels */}
        <div className="w-14 shrink-0 border-r border-[#d6e8f6]" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="flex min-w-0 flex-1 flex-col items-center border-r border-[#d6e8f6] py-2 last:border-r-0"
          >
            <span className="text-[11px] uppercase tracking-wide text-[#2b5876]">
              {labels.weekdaysShort[day.getDay()]}
            </span>
            <span
              className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                isToday(day) ? "bg-[#003F60] text-white" : "text-[#003F60]"
              }`}
            >
              {format(day, "d")}
            </span>
          </div>
        ))}
      </div>

      {/* All-day events row (birthdays) */}
      {weekDays.some((day) => events.some((e) => isSameDay(e.startsAt, day) && e.allDay)) && (
        <div className="flex border-b border-[#d6e8f6]">
          <div className="w-14 shrink-0 border-r border-[#d6e8f6] flex items-center justify-end pr-2">
            <span className="text-[9px] font-medium uppercase tracking-wide text-[#93c5e0]">all‑day</span>
          </div>
          {weekDays.map((day) => {
            const allDayEvs = events.filter((e) => isSameDay(e.startsAt, day) && e.allDay);
            return (
              <div
                key={day.toISOString()}
                className="min-w-0 flex-1 border-r border-[#d6e8f6] last:border-r-0 p-0.5 space-y-0.5"
              >
                {allDayEvs.map((ev) => {
                  const RoleIcon = ev.role ? BIRTHDAY_ROLE_ICONS[ev.role] : undefined;
                  const pillColor = (ev.role ? BIRTHDAY_ROLE_PILL_COLORS[ev.role] : undefined) ?? "bg-pink-100 text-pink-700";
                  const tooltipLines = [ev.title, labels.roleLabels?.[ev.role ?? ""] ?? "", format(ev.startsAt, "d MMM")].filter(Boolean) as string[];
                  return (
                    <Tooltip key={ev.id} lines={tooltipLines}>
                    <div
                      onClick={() => onEventClick?.(ev.id)}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium cursor-default ${pillColor}`}
                    >
                      <Cake className="mr-0.5 inline h-2.5 w-2.5 shrink-0" />
                      {RoleIcon && <RoleIcon className="mr-0.5 inline h-2.5 w-2.5 shrink-0" />}
                      {ev.title}
                    </div>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable time grid */}
      <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
        <div className="flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Time labels */}
          <div className="w-14 shrink-0 border-r border-[#d6e8f6]">
            {HOUR_LABELS.map((label, i) => (
              <div
                key={label}
                style={{ height: HOUR_HEIGHT, top: i * HOUR_HEIGHT }}
                className="relative"
              >
                <span className="absolute right-2 top-1 text-[10px] text-[#2b5876]">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayEvents = events.filter((e) =>
              e.allDay
                ? isSameDay(e.startsAt, day)
                : e.startsAt <= dayEnd && e.endsAt >= dayStart
            );

            return (
              <div
                key={day.toISOString()}
                className="relative min-w-0 flex-1 border-r border-[#d6e8f6] last:border-r-0"
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {/* Hour grid lines */}
                {HOUR_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-b border-[#d6e8f6]"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Event blocks */}
                {dayEvents.map((ev) => {
                  if (ev.allDay) return null;

                  const startH =
                    ev.startsAt.getHours() + ev.startsAt.getMinutes() / 60;
                  const endH =
                    ev.endsAt.getHours() + ev.endsAt.getMinutes() / 60;
                  const clampedStart = Math.max(startH, VISIBLE_START);
                  const clampedEnd = Math.min(endH, VISIBLE_END);

                  if (clampedEnd <= clampedStart) return null;

                  const top = (clampedStart - VISIBLE_START) * HOUR_HEIGHT;
                  const height = Math.max(
                    22,
                    (clampedEnd - clampedStart) * HOUR_HEIGHT - 2
                  );

                  const tooltipLines = isSameDay(ev.startsAt, ev.endsAt)
                    ? [ev.title, `${format(ev.startsAt, "HH:mm")} – ${format(ev.endsAt, "HH:mm")}`, ev.description ?? ""].filter(Boolean) as string[]
                    : [ev.title, `${format(ev.startsAt, "d MMM")} – ${format(ev.endsAt, "d MMM")}`, ev.description ?? ""].filter(Boolean) as string[];

                  return (
                    <Tooltip key={ev.id} lines={tooltipLines}>
                    <button
                      onClick={() => onEventClick?.(ev.id)}
                      style={{ top, height, left: 2, right: 2 }}
                      className={`absolute overflow-hidden rounded-md px-1.5 py-1 text-left text-[11px] font-medium transition-opacity hover:opacity-80 ${
                        BLOCK_COLORS[ev.status] ?? "bg-gray-50 text-gray-600 border-l-2 border-gray-300"
                      }`}
                    >
                      <div className="truncate leading-tight">{ev.title}</div>
                      <div className="opacity-75">
                        {format(ev.startsAt, "HH:mm")}
                      </div>
                    </button>
                    </Tooltip>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
