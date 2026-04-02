import { PlatformDashboardGate } from "@/app/platfrom/dashboard/PlatformDashboardGate";
import { AppDashboardCard, AppDashboardShell } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";

export default function StaffDashboardPage() {
  const locale = defaultLocale;

  return (
    <PlatformDashboardGate
      checkingLabel={translate(locale, "platform.entry.checking")}
      expectedPath="/platfrom/dashboard/staff"
    >
      <AppDashboardShell
        badge={translate(locale, "platform.dashboard.staff.badge")}
        title={translate(locale, "platform.dashboard.staff.title")}
        subtitle={translate(locale, "platform.dashboard.staff.subtitle")}
        logoAriaLabel={translate(locale, "nav.logoAria")}
        profileLabel={translate(locale, "platform.nav.profile")}
        signOutLabel={translate(locale, "platform.nav.signOut")}
        signingOutLabel={translate(locale, "platform.nav.signingOut")}
        loadingIdentityLabel={translate(locale, "platform.nav.loadingIdentity")}
        roleSuperadminLabel={translate(locale, "platform.nav.role.superadmin")}
        roleStaffLabel={translate(locale, "platform.nav.role.staff")}
        roleParentLabel={translate(locale, "platform.nav.role.parent")}
      >
        <AppDashboardCard
          title={translate(locale, "platform.dashboard.staff.approvals.title")}
          description={translate(locale, "platform.dashboard.staff.approvals.description")}
        />
        <AppDashboardCard
          title={translate(locale, "platform.dashboard.staff.students.title")}
          description={translate(locale, "platform.dashboard.staff.students.description")}
        />
        <AppDashboardCard
          title={translate(locale, "platform.dashboard.staff.notifications.title")}
          description={translate(locale, "platform.dashboard.staff.notifications.description")}
        />
      </AppDashboardShell>
    </PlatformDashboardGate>
  );
}
