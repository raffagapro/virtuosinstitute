import { type ReactNode } from "react";
import { AppDashboardNavbar } from "@/components/ui/AppDashboardNavbar";
import { AppFooter } from "@/components/layout";

interface AppDashboardShellProps {
  badge: string;
  title: string;
  subtitle: string;
  logoAriaLabel: string;
  profileLabel: string;
  signOutLabel: string;
  signingOutLabel: string;
  loadingIdentityLabel: string;
  roleSuperadminLabel: string;
  roleStaffLabel: string;
  roleParentLabel: string;
  children: ReactNode;
}

export function AppDashboardShell({
  badge,
  title,
  subtitle,
  logoAriaLabel,
  profileLabel,
  signOutLabel,
  signingOutLabel,
  loadingIdentityLabel,
  roleSuperadminLabel,
  roleStaffLabel,
  roleParentLabel,
  children,
}: AppDashboardShellProps) {
  return (
    <div className="min-h-screen bg-[#f5fbff] text-[#003F60] flex flex-col">
      <main className="flex-1 px-6 py-12 pt-[94px] pb-40">
        <AppDashboardNavbar
          logoAriaLabel={logoAriaLabel}
          profileLabel={profileLabel}
          signOutLabel={signOutLabel}
          signingOutLabel={signingOutLabel}
          loadingIdentityLabel={loadingIdentityLabel}
          roleSuperadminLabel={roleSuperadminLabel}
          roleStaffLabel={roleStaffLabel}
          roleParentLabel={roleParentLabel}
        />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <header className="rounded-3xl border border-[#77b5d9] bg-white/80 p-6 sm:p-8">
            <p className="font-['Sora',Helvetica,Arial,sans-serif] text-sm font-bold uppercase tracking-[1.3px] text-[#2b5876]">
              {badge}
            </p>
            <h1 className="mt-3 font-['Sora',Helvetica,Arial,sans-serif] text-3xl font-bold leading-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-[#2b5876]">{subtitle}</p>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</section>
        </div>
      </main>
      <AppFooter locale="es-MX" compact />
    </div>
  );
}
