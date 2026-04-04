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
        enrollmentFormDownload: translate(locale, "platform.dashboard.parent.children.page.enrollmentFormDownload"),
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
          curpError: translate(locale, "platform.dashboard.parent.children.form.curpError"),
          curpLookupLink: translate(locale, "platform.dashboard.parent.children.form.curpLookupLink"),
          gradeLevel: translate(locale, "platform.dashboard.parent.children.form.gradeLevel"),
          gradeLevelDefaultOption: translate(locale, "platform.dashboard.parent.children.form.gradeLevelDefaultOption"),
          bloodType: translate(locale, "platform.dashboard.parent.children.form.bloodType"),
          bloodTypePlaceholder: translate(locale, "platform.dashboard.parent.children.form.bloodTypePlaceholder"),
          allergies: translate(locale, "platform.dashboard.parent.children.form.allergies"),
          allergiesPlaceholder: translate(locale, "platform.dashboard.parent.children.form.allergiesPlaceholder"),
          dataAuthorization: translate(locale, "platform.dashboard.parent.children.form.dataAuthorization"),
          cancel: translate(locale, "platform.dashboard.parent.children.form.cancel"),
          submit: translate(locale, "platform.dashboard.parent.children.form.submit"),
          submitting: translate(locale, "platform.dashboard.parent.children.form.submitting"),
          error: translate(locale, "platform.dashboard.parent.children.form.error"),
          errorForbidden: translate(locale, "platform.dashboard.parent.children.form.errorForbidden"),
          errorInvalidCurp: translate(locale, "platform.dashboard.parent.children.form.errorInvalidCurp"),
          errorDuplicateCurp: translate(locale, "platform.dashboard.parent.children.form.errorDuplicateCurp"),
        },
        edit: {
          title: translate(locale, "platform.dashboard.parent.children.edit.title"),
          fullName: translate(locale, "platform.dashboard.parent.children.form.fullName"),
          fullNamePlaceholder: translate(locale, "platform.dashboard.parent.children.form.fullNamePlaceholder"),
          dateOfBirth: translate(locale, "platform.dashboard.parent.children.form.dateOfBirth"),
          curp: translate(locale, "platform.dashboard.parent.children.form.curp"),
          curpPlaceholder: translate(locale, "platform.dashboard.parent.children.form.curpPlaceholder"),
          curpError: translate(locale, "platform.dashboard.parent.children.form.curpError"),
          curpLookupLink: translate(locale, "platform.dashboard.parent.children.form.curpLookupLink"),
          gradeLevel: translate(locale, "platform.dashboard.parent.children.form.gradeLevel"),
          gradeLevelDefaultOption: translate(locale, "platform.dashboard.parent.children.form.gradeLevelDefaultOption"),
          bloodType: translate(locale, "platform.dashboard.parent.children.form.bloodType"),
          bloodTypePlaceholder: translate(locale, "platform.dashboard.parent.children.form.bloodTypePlaceholder"),
          allergies: translate(locale, "platform.dashboard.parent.children.form.allergies"),
          allergiesPlaceholder: translate(locale, "platform.dashboard.parent.children.form.allergiesPlaceholder"),
          cancel: translate(locale, "platform.dashboard.parent.children.edit.cancel"),
          save: translate(locale, "platform.dashboard.parent.children.edit.save"),
          saving: translate(locale, "platform.dashboard.parent.children.edit.saving"),
          error: translate(locale, "platform.dashboard.parent.children.edit.error"),
          errorInvalidCurp: translate(locale, "platform.dashboard.parent.children.edit.errorInvalidCurp"),
          errorDuplicateCurp: translate(locale, "platform.dashboard.parent.children.edit.errorDuplicateCurp"),
        },
      }}
    />
  );
}
