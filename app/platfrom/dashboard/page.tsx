import { defaultLocale, translate } from "@/lib/i18n";
import { PlatformDashboardGate } from "@/app/platfrom/dashboard/PlatformDashboardGate";

export default function PlatformDashboardResolverPage() {
  const locale = defaultLocale;

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <PlatformDashboardGate checkingLabel={translate(locale, "platform.entry.checking")} />
      </div>
    </main>
  );
}
