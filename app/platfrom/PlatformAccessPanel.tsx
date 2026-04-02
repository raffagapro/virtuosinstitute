"use client";

import { useEffect, useMemo, useState } from "react";
import { AppButton } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type AccessStatus = "signed_out" | "pending_review" | "approved" | "error" | "config_error" | "account_removed";

interface PlatformAccessPanelProps {
  signInLabel: string;
  providerLabel: string;
  signInErrorLabel: string;
  checkingLabel: string;
  pendingTitle: string;
  pendingBody: string;
  approvedTitle: string;
  approvedBody: string;
  configErrorTitle: string;
  configErrorBody: string;
  accountRemovedTitle: string;
  accountRemovedBody: string;
  backHomeLabel: string;
  onApprovedRedirect?: (path: string) => void;
}

interface BootstrapResponse {
  ok: boolean;
  status?: "pending" | "approved" | "rejected" | "suspended";
  dashboardPath?: string;
  reason?: string;
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

export function PlatformAccessPanel({
  signInLabel,
  providerLabel,
  signInErrorLabel,
  checkingLabel,
  pendingTitle,
  pendingBody,
  approvedTitle,
  approvedBody,
  configErrorTitle,
  configErrorBody,
  accountRemovedTitle,
  accountRemovedBody,
  backHomeLabel,
  onApprovedRedirect,
}: PlatformAccessPanelProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<AccessStatus>("signed_out");
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasSignInError, setHasSignInError] = useState(false);
  const [approvedDashboardPath, setApprovedDashboardPath] = useState("/platfrom/dashboard");

  const renderGoogleSignInAction = () => (
    <AppButton
      type="button"
      onClick={onGoogleSignIn}
      className="text-base px-8 py-3 gap-2"
      disabled={isSigningIn}
    >
      <span>{signInLabel}</span>
      <GoogleGlyph />
      <span>{providerLabel}</span>
    </AppButton>
  );

  const signOutWithoutError = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Keep UI flow resilient even if sign out fails.
    }
  };

  const refreshStatus = async () => {
    setIsLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus("signed_out");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/platform-bootstrap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      let failureReason = "";
      try {
        const failurePayload = (await response.json()) as BootstrapResponse;
        failureReason = failurePayload.reason ?? "";
      } catch {
        failureReason = "";
      }

      if (failureReason === "service-role-missing") {
        await signOutWithoutError();
        setStatus("config_error");
      } else if (failureReason === "account-removed") {
        await signOutWithoutError();
        setStatus("account_removed");
      } else {
        await signOutWithoutError();
        setStatus("error");
      }
      setIsLoading(false);
      return;
    }

    const payload = (await response.json()) as BootstrapResponse;

    if (!payload.ok || !payload.status) {
      setStatus("error");
      setIsLoading(false);
      return;
    }

    if (payload.status === "approved") {
      setApprovedDashboardPath(payload.dashboardPath ?? "/platfrom/dashboard");
      setStatus("approved");
    } else {
      await signOutWithoutError();
      setStatus("pending_review");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    if (status === "approved") {
      if (onApprovedRedirect) {
        onApprovedRedirect(approvedDashboardPath);
      } else {
        window.location.assign(approvedDashboardPath);
      }
    }
  }, [approvedDashboardPath, onApprovedRedirect, status]);

  const onGoogleSignIn = async () => {
    setIsSigningIn(true);
    setHasSignInError(false);

    const redirectTo = `${window.location.origin}/platfrom`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setStatus("error");
      setHasSignInError(true);
      setIsSigningIn(false);
    }
  };

  if (isLoading) {
    return <p className="text-base text-[#2b5876]">{checkingLabel}</p>;
  }

  if (status === "signed_out") {
    return (
      <div className="flex flex-col items-start gap-3">
        {renderGoogleSignInAction()}
        {hasSignInError ? <p className="text-sm text-[#b51d3a]">{signInErrorLabel}</p> : null}
      </div>
    );
  }

  if (status === "approved") {
    return <p className="text-base text-[#2b5876]">{checkingLabel}</p>;
  }

  if (status === "pending_review") {
    return (
      <div className="space-y-4 rounded-2xl border border-[#77b5d9] bg-white/70 p-6">
        <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">{pendingTitle}</h2>
        <p className="text-[#2b5876]">{pendingBody}</p>
        <div className="flex flex-wrap gap-3">
          {renderGoogleSignInAction()}
          <AppButton as="a" href="/" className="text-base px-8 py-3">
            {backHomeLabel}
          </AppButton>
        </div>
        {hasSignInError ? <p className="text-sm text-[#b51d3a]">{signInErrorLabel}</p> : null}
      </div>
    );
  }

  if (status === "config_error") {
    return (
      <div className="space-y-4 rounded-2xl border border-[#77b5d9] bg-white/70 p-6">
        <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">{configErrorTitle}</h2>
        <p className="text-[#2b5876]">{configErrorBody}</p>
        <div className="flex flex-wrap gap-3">
          <AppButton as="a" href="/" className="text-base px-8 py-3">
            {backHomeLabel}
          </AppButton>
        </div>
      </div>
    );
  }

  if (status === "account_removed") {
    return (
      <div className="space-y-4 rounded-2xl border border-[#77b5d9] bg-white/70 p-6">
        <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60]">{accountRemovedTitle}</h2>
        <p className="text-[#2b5876]">{accountRemovedBody}</p>
        <div className="flex flex-wrap gap-3">
          <AppButton as="a" href="/" className="text-base px-8 py-3">
            {backHomeLabel}
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#d67a8b] bg-[#fff4f6] p-6">
      <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#7e1d2f]">{signInErrorLabel}</h2>
      <p className="text-[#7e1d2f]">{configErrorBody}</p>
      <div className="flex flex-wrap gap-3">
        {renderGoogleSignInAction()}
        <AppButton as="a" href="/" className="text-base px-8 py-3">
          {backHomeLabel}
        </AppButton>
      </div>
      {hasSignInError ? <p className="text-sm text-[#b51d3a]">{signInErrorLabel}</p> : null}
    </div>
  );
}
