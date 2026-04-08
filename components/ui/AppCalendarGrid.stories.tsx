import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppCalendarGrid } from "./AppCalendarGrid";

// Fixed reference date so stories render consistently in Storybook.
const REF_DATE = new Date(2025, 5, 15, 9, 0, 0); // June 15 2025, 09:00

const LABELS = {
  viewMonth: "Month",
  viewWeek: "Week",
  today: "Today",
  weekdaysShort: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  statusLabels: {
    requested: "Requested",
    confirmed: "Confirmed",
    completed: "Completed",
    canceled: "Canceled",
    no_show: "No Show",
  },
};

/** One appointment at each status to exercise all colour mappings. */
const SAMPLE_EVENTS = [
  {
    id: "1",
    title: "Ana García",
    startsAt: new Date(2025, 5, 16, 9, 0),
    endsAt:   new Date(2025, 5, 16, 9, 30),
    status: "requested",
  },
  {
    id: "2",
    title: "Carlos López",
    startsAt: new Date(2025, 5, 16, 11, 0),
    endsAt:   new Date(2025, 5, 16, 11, 30),
    status: "confirmed",
  },
  {
    id: "3",
    title: "María Soto",
    startsAt: new Date(2025, 5, 17, 10, 0),
    endsAt:   new Date(2025, 5, 17, 10, 30),
    status: "completed",
  },
  {
    id: "4",
    title: "Pedro Ruiz",
    startsAt: new Date(2025, 5, 18, 14, 0),
    endsAt:   new Date(2025, 5, 18, 14, 30),
    status: "canceled",
  },
  {
    id: "5",
    title: "Laura Díaz",
    startsAt: new Date(2025, 5, 19, 15, 0),
    endsAt:   new Date(2025, 5, 19, 15, 30),
    status: "no_show",
  },
];

const meta: Meta<typeof AppCalendarGrid> = {
  title: "UI/AppCalendarGrid",
  component: AppCalendarGrid,
  args: {
    events: SAMPLE_EVENTS,
    loading: false,
    labels: LABELS,
    onRangeChange: () => undefined,
    onEventClick: () => undefined,
  },
};

export default meta;
type Story = StoryObj<typeof AppCalendarGrid>;

export const MonthView: Story = {};

export const Loading: Story = {
  args: { loading: true, events: [] },
};

export const Empty: Story = {
  args: { events: [] },
};
