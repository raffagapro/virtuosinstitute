import { defaultLocale, translate } from "@/lib/i18n";
import { SuperadminDevTools } from "@/app/platfrom/dashboard/superadmin/dev/SuperadminDevTools";

export default function SuperadminDevToolsPage() {
  const locale = defaultLocale;

  return (
    <SuperadminDevTools
      title={translate(locale, "platform.dashboard.superadmin.dev.title")}
      subtitle={translate(locale, "platform.dashboard.superadmin.dev.subtitle")}
      passwordResetTitle={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.title")}
      passwordResetSubtitle={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.subtitle")}
      passwordResetSubmitLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.submit")}
      passwordResetSubmittingLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.submitting")}
      passwordResetSuccessLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.success")}
      passwordResetPasswordLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.password")}
      passwordResetPasswordPlaceholder={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.passwordPlaceholder")}
      passwordResetSearchEmailLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.searchEmail")}
      passwordResetSearchEmailPlaceholder={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.searchEmailPlaceholder")}
      passwordResetSearchingLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.searching")}
      passwordResetNoMatchesLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.noMatches")}
      passwordResetMatchesTitle={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.matchesTitle")}
      passwordResetMatchesEmailColumnLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.matchesEmailColumn")}
      passwordResetMatchesActionLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.matchesAction")}
      passwordResetSelectedLabel={translate(locale, "platform.dashboard.superadmin.dev.passwordReset.selected")}
      quickUnauthorizedTitle={translate(locale, "platform.dashboard.superadmin.dev.quick.title")}
      quickUnauthorizedSubtitle={translate(locale, "platform.dashboard.superadmin.dev.quick.subtitle")}
      quickUnauthorizedSubmitLabel={translate(locale, "platform.dashboard.superadmin.dev.quick.submit")}
      quickUnauthorizedSubmittingLabel={translate(locale, "platform.dashboard.superadmin.dev.quick.submitting")}
      quickUnauthorizedSuccessLabel={translate(locale, "platform.dashboard.superadmin.dev.quick.success")}
      quickUnauthorizedPasswordLabel={translate(locale, "platform.dashboard.superadmin.dev.quick.password")}
      quickUnauthorizedPasswordPlaceholder={translate(locale, "platform.dashboard.superadmin.dev.quick.passwordPlaceholder")}
      showPasswordLabel={translate(locale, "platform.dashboard.superadmin.dev.password.show")}
      hidePasswordLabel={translate(locale, "platform.dashboard.superadmin.dev.password.hide")}
      emailLabel={translate(locale, "platform.dashboard.superadmin.dev.form.email")}
      emailPlaceholder={translate(locale, "platform.dashboard.superadmin.dev.form.emailPlaceholder")}
      fullNameLabel={translate(locale, "platform.dashboard.superadmin.dev.form.fullName")}
      fullNamePlaceholder={translate(locale, "platform.dashboard.superadmin.dev.form.fullNamePlaceholder")}
      passwordLabel={translate(locale, "platform.dashboard.superadmin.dev.form.password")}
      passwordPlaceholder={translate(locale, "platform.dashboard.superadmin.dev.form.passwordPlaceholder")}
      roleLabel={translate(locale, "platform.dashboard.superadmin.dev.form.role")}
      statusLabel={translate(locale, "platform.dashboard.superadmin.dev.form.status")}
      localeLabel={translate(locale, "platform.dashboard.superadmin.dev.form.locale")}
      submitLabel={translate(locale, "platform.dashboard.superadmin.dev.form.submit")}
      submittingLabel={translate(locale, "platform.dashboard.superadmin.dev.form.submitting")}
      sessionErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.sessionError")}
      genericErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.genericError")}
      emailAuthDisabledErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.emailAuthDisabled")}
      forbiddenErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.forbidden")}
      emailNotFoundErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.emailNotFound")}
      duplicateEmailErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.duplicateEmail")}
      serviceRoleMissingErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.serviceRoleMissing")}
      invalidInputErrorLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.invalidInput")}
      successLabel={translate(locale, "platform.dashboard.superadmin.dev.feedback.success")}
      roles={[
        { value: "guest", label: translate(locale, "platform.roles.guest") },
        { value: "parent", label: translate(locale, "platform.roles.parent") },
        { value: "student", label: translate(locale, "platform.roles.student") },
        { value: "clerk", label: translate(locale, "platform.roles.clerk") },
        { value: "teacher", label: translate(locale, "platform.roles.teacher") },
        { value: "coordination", label: translate(locale, "platform.roles.coordination") },
        { value: "direction", label: translate(locale, "platform.roles.direction") },
        { value: "school_owner", label: translate(locale, "platform.roles.school_owner") },
      ]}
      statuses={[
        { value: "approved", label: translate(locale, "platform.status.approved") },
        { value: "pending", label: translate(locale, "platform.status.pending") },
        { value: "suspended", label: translate(locale, "platform.status.suspended") },
        { value: "rejected", label: translate(locale, "platform.status.rejected") },
      ]}
      locales={[
        { value: "es-MX", label: translate(locale, "platform.locale.esMX") },
        { value: "en-US", label: translate(locale, "platform.locale.enUS") },
      ]}
    />
  );
}
