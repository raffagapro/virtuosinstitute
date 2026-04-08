import { defaultLocale, translate } from "@/lib/i18n";
import { ParentSchoolCalendarPage } from "./ParentSchoolCalendarPage";

export default function ParentSchoolCalendarRoute() {
  const locale = defaultLocale;

  const labels = {
    title: translate(locale, "platform.calendar.school.title"),
    subtitle: translate(locale, "platform.calendar.school.subtitle"),
    loading: translate(locale, "platform.calendar.school.loading"),
    error: translate(locale, "platform.calendar.school.error"),
    calendarGrid: {
      viewMonth: translate(locale, "platform.calendar.grid.viewMonth"),
      viewWeek: translate(locale, "platform.calendar.grid.viewWeek"),
      today: translate(locale, "platform.calendar.grid.today"),
      weekdaysShort: [
        translate(locale, "platform.calendar.grid.weekdays.sun"),
        translate(locale, "platform.calendar.grid.weekdays.mon"),
        translate(locale, "platform.calendar.grid.weekdays.tue"),
        translate(locale, "platform.calendar.grid.weekdays.wed"),
        translate(locale, "platform.calendar.grid.weekdays.thu"),
        translate(locale, "platform.calendar.grid.weekdays.fri"),
        translate(locale, "platform.calendar.grid.weekdays.sat"),
      ],
      statusLabels: {
        school_event:     translate(locale, "platform.calendar.school.eventType.school_event"),
        student_birthday: translate(locale, "platform.calendar.school.eventType.student_birthday"),
        staff_birthday:   translate(locale, "platform.calendar.school.eventType.staff_birthday"),
      },
      roleLabels: {
        school_owner: translate(locale, "platform.calendar.role.school_owner"),
        direction:    translate(locale, "platform.calendar.role.direction"),
        coordination: translate(locale, "platform.calendar.role.coordination"),
        teacher:      translate(locale, "platform.calendar.role.teacher"),
        clerk:        translate(locale, "platform.calendar.role.clerk"),
        student:      translate(locale, "platform.calendar.role.student"),
      },
    },
    eventType: {
      school_event:     translate(locale, "platform.calendar.school.eventType.school_event"),
      student_birthday: translate(locale, "platform.calendar.school.eventType.student_birthday"),
      staff_birthday:   translate(locale, "platform.calendar.school.eventType.staff_birthday"),
    },
  };

  return <ParentSchoolCalendarPage labels={labels} />;
}
