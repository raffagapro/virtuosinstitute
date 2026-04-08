import { defaultLocale, translate } from "@/lib/i18n";
import { SuperadminCalendarView } from "./SuperadminCalendarView";

export default function SuperadminCalendarRoute() {
  const locale = defaultLocale;

  const labels = {
    title: translate(locale, "platform.calendar.superadmin.title"),
    subtitle: translate(locale, "platform.calendar.superadmin.subtitle"),
    loading: translate(locale, "platform.calendar.loading"),
    error: translate(locale, "platform.calendar.error"),
    calendarTypes: {
      coordination_appointments: translate(locale, "platform.calendar.parent.book.coordination"),
      direction_appointments: translate(locale, "platform.calendar.parent.book.direction"),
      clerk_appointments: translate(locale, "platform.calendar.superadmin.clerk"),
    },
    appointments: {
      empty: translate(locale, "platform.calendar.staff.appointments.empty"),
      requested: translate(locale, "platform.calendar.appointment.status.requested"),
      confirmed: translate(locale, "platform.calendar.appointment.status.confirmed"),
      completed: translate(locale, "platform.calendar.appointment.status.completed"),
      canceled: translate(locale, "platform.calendar.appointment.status.canceled"),
      noShow: translate(locale, "platform.calendar.appointment.status.noShow"),
      requesterNote: translate(locale, "platform.calendar.staff.appointments.requesterNote"),
    },
  };

  return <SuperadminCalendarView labels={labels} />;
}
