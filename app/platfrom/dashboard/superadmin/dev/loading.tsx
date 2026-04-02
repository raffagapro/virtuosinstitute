import { Loader2 } from "lucide-react";
import { defaultLocale, translate } from "@/lib/i18n";

export default function SuperadminDevToolsLoading() {
  const locale = defaultLocale;

  return (
    <div className="space-y-4 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[#003F60]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <p className="font-['Sora',Helvetica,Arial,sans-serif] text-xl font-bold sm:text-2xl">
            {translate(locale, "platform.dashboard.superadmin.dev.loading.title")}
          </p>
        </div>
        <p className="text-sm text-[#2b5876] sm:text-base">{translate(locale, "platform.dashboard.superadmin.dev.loading.body")}</p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#e4eef7] bg-[#f5fbff] p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-[#dbeaf6]" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-11 animate-pulse rounded-xl bg-white/80" />
          <div className="h-11 animate-pulse rounded-xl bg-white/80" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-11 animate-pulse rounded-xl bg-[#f5fbff]" />
        <div className="h-11 animate-pulse rounded-xl bg-[#f5fbff]" />
        <div className="h-11 animate-pulse rounded-xl bg-[#f5fbff]" />
        <div className="h-11 animate-pulse rounded-xl bg-[#f5fbff]" />
      </div>
    </div>
  );
}
