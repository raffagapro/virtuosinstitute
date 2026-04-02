import { defaultLocale, translate } from "@/lib/i18n";

export default function SuperadminProfilePage() {
  const locale = defaultLocale;

  return (
    <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
        {translate(locale, "platform.profile.title")}
      </h1>
      <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{translate(locale, "platform.profile.subtitle")}</p>
    </div>
  );
}
