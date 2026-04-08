import { defaultLocale, translate } from "@/lib/i18n";
import { ParentNotificationsPage } from "./ParentNotificationsPage";

export default function ParentNotificationsRoute() {
  const locale = defaultLocale;

  const labels = {
    title:    translate(locale, "platform.notifications.title"),
    subtitle: translate(locale, "platform.notifications.subtitle"),
    loading:  translate(locale, "platform.notifications.loading"),
    error:    translate(locale, "platform.notifications.error"),
    empty:    translate(locale, "platform.notifications.empty"),
    markRead: translate(locale, "platform.notifications.markRead"),
    labelNew: translate(locale, "platform.notifications.labelNew"),
    labelRead: translate(locale, "platform.notifications.labelRead"),
  };

  return <ParentNotificationsPage labels={labels} />;
}
