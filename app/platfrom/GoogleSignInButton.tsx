"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface GoogleSignInButtonProps {
  buttonLabel: string;
  providerLabel: string;
  errorLabel: string;
}

function GoogleGlyph() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 4 1.5l2.7-2.6C17.1 3.3 14.8 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12S6.7 21.6 12 21.6c6.9 0 9.6-4.8 9.6-7.3 0-.5-.1-.9-.1-1.2H12z"
      />
      <path
        fill="#34A853"
        d="M2.4 7.9l3.2 2.3C6.4 8 9 6 12 6c1.9 0 3.2.8 4 1.5l2.7-2.6C17.1 3.3 14.8 2.4 12 2.4c-3.7 0-6.9 2.1-8.5 5.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.6c2.7 0 5-0.9 6.7-2.5l-3.1-2.5c-.8.6-1.9 1.1-3.6 1.1-3.8 0-5.2-2.5-5.5-3.8l-3.2 2.5c1.5 3.5 4.9 5.2 8.7 5.2z"
      />
      <path
        fill="#4285F4"
        d="M21.6 12.3c0-.6-.1-1-.2-1.5H12v3.3h5.4c-.2 1.1-.9 2.3-1.9 3l3.1 2.5c1.8-1.6 3-4 3-7.3z"
      />
    </svg>
  );
}

export function GoogleSignInButton({ buttonLabel, providerLabel, errorLabel }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const onGoogleSignIn = async () => {
    setIsLoading(true);
    setHasError(false);

    const supabase = getSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/platfrom`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setHasError(true);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <AppButton
        type="button"
        onClick={onGoogleSignIn}
        className="text-base px-8 py-3 gap-2"
        disabled={isLoading}
      >
        <span>{buttonLabel}</span>
        <GoogleGlyph />
        <span>{providerLabel}</span>
      </AppButton>
      {hasError ? <p className="text-sm text-[#b51d3a]">{errorLabel}</p> : null}
    </div>
  );
}
