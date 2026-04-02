"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppButton } from "@/components/ui";
import { defaultLocale, translate } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function UpdatePasswordPage() {
  const locale = defaultLocale;
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage(translate(locale, "platform.updatePassword.validationLength"));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(translate(locale, "platform.updatePassword.validationMatch"));
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setErrorMessage(translate(locale, "platform.updatePassword.error"));
      setIsSubmitting(false);
      return;
    }

    router.replace("/platfrom");
  };

  return (
    <main className="min-h-screen bg-[#f5fbff] text-[#003F60] px-6 py-16">
      <div className="max-w-xl mx-auto space-y-6 rounded-2xl border border-[#77b5d9] bg-white/70 p-6">
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-3xl font-bold">
          {translate(locale, "platform.updatePassword.title")}
        </h1>
        <p className="text-[#2b5876]">{translate(locale, "platform.updatePassword.subtitle")}</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#1f4c68]">{translate(locale, "platform.updatePassword.passwordLabel")}</span>
            <input
              type="password"
              className="w-full rounded-xl border border-[#77b5d9] px-4 py-3 text-[#003F60]"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[#1f4c68]">{translate(locale, "platform.updatePassword.confirmPasswordLabel")}</span>
            <input
              type="password"
              className="w-full rounded-xl border border-[#77b5d9] px-4 py-3 text-[#003F60]"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          {errorMessage ? <p className="text-sm text-[#b51d3a]">{errorMessage}</p> : null}

          <AppButton type="submit" disabled={isSubmitting} className="text-base px-8 py-3">
            {translate(locale, "platform.updatePassword.submit")}
          </AppButton>
        </form>
      </div>
    </main>
  );
}
