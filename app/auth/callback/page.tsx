"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AppButton } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type CallbackStatus = "pending" | "success" | "error";

function isEmailOtpType(value: string): value is EmailOtpType {
  return value === "signup" || value === "recovery" || value === "invite" || value === "email_change" || value === "email";
}

function sanitizeNextPath(nextPath: string | null, fallbackPath: string) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return fallbackPath;
  }

  return nextPath;
}

function AuthCallbackContent() {
  const locale = defaultLocale;
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [status, setStatus] = useState<CallbackStatus>("pending");

  useEffect(() => {
    const verify = async () => {
      const tokenHash = searchParams.get("token_hash")?.trim() ?? "";
      const typeValue = searchParams.get("type")?.trim() ?? "";
      const nextPath = sanitizeNextPath(searchParams.get("next"), "/platfrom");

      if (!tokenHash || !isEmailOtpType(typeValue)) {
        setStatus("error");
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: typeValue,
      });

      if (error) {
        setStatus("error");
        return;
      }

      setStatus("success");
      if (typeValue === "recovery") {
        router.replace("/auth/update-password");
        return;
      }

      router.replace(nextPath);
    };

    void verify();
  }, [router, searchParams, supabase.auth]);

  if (status === "pending" || status === "success") {
    return (
      <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
        <div className="max-w-2xl mx-auto space-y-4">
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-3xl font-bold">
            {translate(locale, "platform.authCallback.verifyingTitle")}
          </h1>
          <p className="text-[#2b5876]">{translate(locale, "platform.authCallback.verifyingBody")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-4 rounded-2xl border border-[#d67a8b] bg-[#fff4f6] p-6">
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-3xl font-bold text-[#7e1d2f]">
          {translate(locale, "platform.authCallback.errorTitle")}
        </h1>
        <p className="text-[#7e1d2f]">{translate(locale, "platform.authCallback.errorBody")}</p>
        <AppButton as="a" href="/platfrom" className="text-base px-8 py-3">
          {translate(locale, "platform.authCallback.backToPlatform")}
        </AppButton>
      </div>
    </main>
  );
}

function AuthCallbackFallback() {
  const locale = defaultLocale;

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-3xl font-bold">
          {translate(locale, "platform.authCallback.verifyingTitle")}
        </h1>
        <p className="text-[#2b5876]">{translate(locale, "platform.authCallback.verifyingBody")}</p>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
