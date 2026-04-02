import { AppDashboardCard } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";

export default function ParentDashboardPage() {
  const locale = defaultLocale;

  return (
    <div className="space-y-4 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div>
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
          {translate(locale, "platform.dashboard.parent.title")}
        </h1>
        <p className="mt-2 text-sm text-[#2b5876] sm:text-base">
          {translate(locale, "platform.dashboard.parent.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
