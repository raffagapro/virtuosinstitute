import { defaultLocale, translate } from "@/lib/i18n";
import { ParentChildrenPage } from "./ParentChildrenPage";

export default function ParentChildrenPageRoute() {
  const locale = defaultLocale;

  return (
    <ParentChildrenPage
      labels={{
        title: translate(locale, "platform.dashboard.parent.children.page.title"),
        subtitle: translate(locale, "platform.dashboard.parent.children.page.subtitle"),
        loading: translate(locale, "platform.dashboard.parent.children.page.loading"),
        error: translate(locale, "platform.dashboard.parent.children.page.error"),
        empty: translate(locale, "platform.dashboard.parent.children.page.empty"),
        addButton: translate(locale, "platform.dashboard.parent.children.page.addButton"),
        status: {
          pending: translate(locale, "platform.dashboard.parent.children.page.status.pending"),
          approved: translate(locale, "platform.dashboard.parent.children.page.status.approved"),
          rejected: translate(locale, "platform.dashboard.parent.children.page.status.rejected"),
          suspended: translate(locale, "platform.dashboard.parent.children.page.status.suspended"),
        },
        form: {
          title: translate(locale, "platform.dashboard.parent.children.form.title"),
          fullName: translate(locale, "platform.dashboard.parent.children.form.fullName"),
          fullNamePlaceholder: translate(locale, "platform.dashboard.parent.children.form.fullNamePlaceholder"),
          dateOfBirth: translate(locale, "platform.dashboard.parent.children.form.dateOfBirth"),
          curp: translate(locale, "platform.dashboard.parent.children.form.curp"),
          curpPlaceholder: translate(locale, "platform.dashboard.parent.children.form.curpPlaceholder"),
          gradeLevel: translate(locale, "platform.dashboard.parent.children.form.gradeLevel"),
          gradeLevelPlaceholder: translate(locale, "platform.dashboard.parent.children.form.gradeLevelPlaceholder"),
          cancel: translate(locale, "platform.dashboard.parent.children.form.cancel"),
          submit: translate(locale, "platform.dashboard.parent.children.form.submit"),
          submitting: translate(locale, "platform.dashboard.parent.children.form.submitting"),
          error: translate(locale, "platform.dashboard.parent.children.form.error"),
        },
      }}
    />
  );
}
