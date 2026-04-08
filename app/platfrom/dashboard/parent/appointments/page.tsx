import { defaultLocale, translate } from "@/lib/i18n";
import { ParentAppointmentsPage } from "./ParentAppointmentsPage";

export default function ParentAppointmentsRoute() {
  const locale = defaultLocale;

  const labels = {
    title: translate(locale, "platform.calendar.parent.title"),
    subtitle: translate(locale, "platform.calendar.parent.subtitle"),
    loading: translate(locale, "platform.calendar.loading"),
    error: translate(locale, "platform.calendar.error"),
    tabs: {
      book: translate(locale, "platform.calendar.parent.tabs.book"),
      myAppointments: translate(locale, "platform.calendar.parent.tabs.myAppointments"),
    },
    book: {
      selectDepartment: translate(locale, "platform.calendar.parent.book.selectDepartment"),
      coordination: translate(locale, "platform.calendar.parent.book.coordination"),
      direction: translate(locale, "platform.calendar.parent.book.direction"),
      noSlots: translate(locale, "platform.calendar.parent.book.noSlots"),
      available: translate(locale, "platform.calendar.parent.book.available"),
      requestedByOther: translate(locale, "platform.calendar.parent.book.requestedByOther"),
      selectSlot: translate(locale, "platform.calendar.parent.book.selectSlot"),
      subject: translate(locale, "platform.calendar.parent.book.subject"),
      subjectPlaceholder: translate(locale, "platform.calendar.parent.book.subjectPlaceholder"),
      linkChild: translate(locale, "platform.calendar.parent.book.linkChild"),
      linkChildNone: translate(locale, "platform.calendar.parent.book.linkChildNone"),
      submit: translate(locale, "platform.calendar.parent.book.submit"),
      submitting: translate(locale, "platform.calendar.parent.book.submitting"),
      cancel: translate(locale, "platform.calendar.parent.book.cancel"),
      successMessage: translate(locale, "platform.calendar.parent.book.successMessage"),
      errorUnavailable: translate(locale, "platform.calendar.parent.book.errorUnavailable"),
      errorGeneric: translate(locale, "platform.calendar.parent.book.errorGeneric"),
      weekNav: {
        prev: translate(locale, "platform.calendar.parent.book.weekNav.prev"),
        next: translate(locale, "platform.calendar.parent.book.weekNav.next"),
      },
    },
    myAppointments: {
      empty: translate(locale, "platform.calendar.parent.myAppointments.empty"),
      status: {
        requested: translate(locale, "platform.calendar.appointment.status.requested"),
        confirmed: translate(locale, "platform.calendar.appointment.status.confirmed"),
        completed: translate(locale, "platform.calendar.appointment.status.completed"),
        canceled: translate(locale, "platform.calendar.appointment.status.canceled"),
        no_show: translate(locale, "platform.calendar.appointment.status.noShow"),
      },
      addToCalendar: translate(locale, "platform.calendar.parent.myAppointments.addToCalendar"),
      downloadIcs: translate(locale, "platform.calendar.parent.myAppointments.downloadIcs"),
    },
  };

  return <ParentAppointmentsPage labels={labels} />;
}
