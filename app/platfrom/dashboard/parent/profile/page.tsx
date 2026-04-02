import { PlatformDashboardGate } from "@/app/platfrom/dashboard/PlatformDashboardGate";
import { defaultLocale, translate } from "@/lib/i18n";

export default function ParentProfilePage() {
  const locale = defaultLocale;

  return (
    <PlatformDashboardGate
      checkingLabel={translate(locale, "platform.entry.checking")}
      expectedPath="/platfrom/dashboard/parent"
    >
      <main className="min-h-screen bg-[#f5fbff] px-6 py-12 pt-[94px] text-[#003F60]">
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
            {translate(locale, "platform.profile.title")}
          </h1>
          <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{translate(locale, "platform.profile.subtitle")}</p>
        </div>
      </main>
    </PlatformDashboardGate>
  );
}
