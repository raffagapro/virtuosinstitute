import { defaultLocale, translate } from "@/lib/i18n";
import { PlatformAccessPanel } from "@/app/platfrom/PlatformAccessPanel";

export default function PlatformLandingPage() {
  const locale = defaultLocale;

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-4xl font-bold leading-tight">
          {translate(locale, "platform.entry.title")}
        </h1>
        <p className="mt-4 text-lg text-[#2b5876]">
          {translate(locale, "platform.entry.subtitle")}
        </p>

        <div className="mt-10">
          <PlatformAccessPanel
            signInLabel={translate(locale, "platform.entry.googleSignIn")}
            providerLabel={translate(locale, "platform.entry.googleProvider")}
            signInErrorLabel={translate(locale, "platform.entry.googleError")}
            checkingLabel={translate(locale, "platform.entry.checking")}
            pendingTitle={translate(locale, "platform.entry.pendingTitle")}
            pendingBody={translate(locale, "platform.entry.pendingBody")}
            approvedTitle={translate(locale, "platform.entry.approvedTitle")}
            approvedBody={translate(locale, "platform.entry.approvedBody")}
            configErrorTitle={translate(locale, "platform.entry.configErrorTitle")}
            configErrorBody={translate(locale, "platform.entry.configErrorBody")}
            accountRemovedTitle={translate(locale, "platform.entry.accountRemovedTitle")}
            accountRemovedBody={translate(locale, "platform.entry.accountRemovedBody")}
            backHomeLabel={translate(locale, "platform.entry.backHome")}
          />
        </div>
      </div>
    </main>
  );
}
