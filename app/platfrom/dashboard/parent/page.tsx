import { PlatformDashboardGate } from "@/app/platfrom/dashboard/PlatformDashboardGate";
import { AppDashboardCard, AppDashboardShell } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";

export default function ParentDashboardPage() {
  const locale = defaultLocale;

  return (
    <PlatformDashboardGate
      checkingLabel={translate(locale, "platform.entry.checking")}
      expectedPath="/platfrom/dashboard/parent"
    >
      <AppDashboardShell
        badge={translate(locale, "platform.dashboard.parent.badge")}
        title={translate(locale, "platform.dashboard.parent.title")}
        subtitle={translate(locale, "platform.dashboard.parent.subtitle")}
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
          title={translate(locale, "platform.dashboard.parent.children.title")}
          description={translate(locale, "platform.dashboard.parent.children.description")}
        />
        <AppDashboardCard
          title={translate(locale, "platform.dashboard.parent.messages.title")}
          description={translate(locale, "platform.dashboard.parent.messages.description")}
        />
        <AppDashboardCard
          title={translate(locale, "platform.dashboard.parent.calendar.title")}
          description={translate(locale, "platform.dashboard.parent.calendar.description")}
        />
      </AppDashboardShell>
    </PlatformDashboardGate>
  );
}
