import { type ReactNode } from "react";
import { PlatformDashboardGate } from "@/app/platfrom/dashboard/PlatformDashboardGate";
import { AppFooter } from "@/components/layout";
import { AppDashboardNavbar, AppDashboardSidebar } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";

interface StaffDashboardLayoutProps {
  children: ReactNode;
}

export default function StaffDashboardLayout({ children }: StaffDashboardLayoutProps) {
  const locale = defaultLocale;

  return (
    <PlatformDashboardGate expectedPath="/platfrom/dashboard/staff">
      <div className="min-h-screen bg-[#f5fbff] text-[#003F60] flex flex-col">
        <main className="flex-1 px-6 py-12 pt-[94px] pb-40">
          <AppDashboardNavbar
            logoAriaLabel={translate(locale, "nav.logoAria")}
            profileLabel={translate(locale, "platform.nav.profile")}
            signOutLabel={translate(locale, "platform.nav.signOut")}
            signingOutLabel={translate(locale, "platform.nav.signingOut")}
            loadingIdentityLabel={translate(locale, "platform.nav.loadingIdentity")}
            roleSuperadminLabel={translate(locale, "platform.nav.role.superadmin")}
            roleStaffLabel={translate(locale, "platform.nav.role.staff")}
            roleParentLabel={translate(locale, "platform.nav.role.parent")}
          />

          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row">
            <AppDashboardSidebar
              ariaLabel={translate(locale, "platform.dashboard.sidebar.pages")}
              items={[
                {
                  href: "/platfrom/dashboard/staff",
                  label: translate(locale, "platform.dashboard.staff.sidebar.home"),
                },
                {
                  href: "/platfrom/dashboard/staff/profile",
                  label: translate(locale, "platform.dashboard.staff.sidebar.profile"),
                },
              ]}
            />

            <section className="min-w-0 flex-1">{children}</section>
          </div>
        </main>
        <AppFooter locale="es-MX" compact />
      </div>
    </PlatformDashboardGate>
  );
}
