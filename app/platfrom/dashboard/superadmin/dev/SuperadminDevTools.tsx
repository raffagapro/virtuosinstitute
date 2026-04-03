"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AppButton } from "@/components/ui";
import { emitSuperadminPendingUsersRefresh } from "@/lib/dashboard-events";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface SuperadminDevToolsProps {
  title: string;
  subtitle: string;
  passwordResetTitle: string;
  passwordResetSubtitle: string;
  passwordResetSubmitLabel: string;
  passwordResetSubmittingLabel: string;
  passwordResetSuccessLabel: string;
  passwordResetPasswordLabel: string;
  passwordResetPasswordPlaceholder: string;
  passwordResetSearchEmailLabel: string;
  passwordResetSearchEmailPlaceholder: string;
  passwordResetSearchingLabel: string;
  passwordResetNoMatchesLabel: string;
  passwordResetMatchesTitle: string;
  passwordResetMatchesEmailColumnLabel: string;
  passwordResetMatchesActionLabel: string;
  passwordResetSelectedLabel: string;
  quickUnauthorizedTitle: string;
  quickUnauthorizedSubtitle: string;
  quickUnauthorizedSubmitLabel: string;
  quickUnauthorizedSubmittingLabel: string;
  quickUnauthorizedSuccessLabel: string;
  quickUnauthorizedPasswordLabel: string;
  quickUnauthorizedPasswordPlaceholder: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  roleLabel: string;
  statusLabel: string;
  localeLabel: string;
  submitLabel: string;
  submittingLabel: string;
  sessionErrorLabel: string;
  genericErrorLabel: string;
  emailAuthDisabledErrorLabel: string;
  forbiddenErrorLabel: string;
  emailNotFoundErrorLabel: string;
  duplicateEmailErrorLabel: string;
  serviceRoleMissingErrorLabel: string;
  invalidInputErrorLabel: string;
  successLabel: string;
  roles: Array<{ value: string; label: string }>;
  statuses: Array<{ value: string; label: string }>;
  locales: Array<{ value: "es-MX" | "en-US"; label: string }>;
}

interface EmailUserResponse {
  ok: boolean;
  email?: string;
  reason?: string;
}

interface ResetCandidateUser {
  id: string;
  email: string;
  fullName: string | null;
}

const PASSWORD_RESET_SEARCH_DEBOUNCE_MS = 2000;

export function SuperadminDevTools({
  title,
  subtitle,
  passwordResetTitle,
  passwordResetSubtitle,
  passwordResetSubmitLabel,
  passwordResetSubmittingLabel,
  passwordResetSuccessLabel,
  passwordResetPasswordLabel,
  passwordResetPasswordPlaceholder,
  passwordResetSearchEmailLabel,
  passwordResetSearchEmailPlaceholder,
  passwordResetSearchingLabel,
  passwordResetNoMatchesLabel,
  passwordResetMatchesTitle,
  passwordResetMatchesEmailColumnLabel,
  passwordResetMatchesActionLabel,
  passwordResetSelectedLabel,
  quickUnauthorizedTitle,
  quickUnauthorizedSubtitle,
  quickUnauthorizedSubmitLabel,
  quickUnauthorizedSubmittingLabel,
  quickUnauthorizedSuccessLabel,
  quickUnauthorizedPasswordLabel,
  quickUnauthorizedPasswordPlaceholder,
  showPasswordLabel,
  hidePasswordLabel,
  emailLabel,
  emailPlaceholder,
  fullNameLabel,
  fullNamePlaceholder,
  passwordLabel,
  passwordPlaceholder,
  roleLabel,
  statusLabel,
  localeLabel,
  submitLabel,
  submittingLabel,
  sessionErrorLabel,
  genericErrorLabel,
  emailAuthDisabledErrorLabel,
  forbiddenErrorLabel,
  emailNotFoundErrorLabel,
  duplicateEmailErrorLabel,
  serviceRoleMissingErrorLabel,
  invalidInputErrorLabel,
  successLabel,
  roles,
  statuses,
  locales,
}: SuperadminDevToolsProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [quickUnauthorizedEmail, setQuickUnauthorizedEmail] = useState("");
  const [quickUnauthorizedPassword, setQuickUnauthorizedPassword] = useState("");
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [passwordResetSearchEmail, setPasswordResetSearchEmail] = useState("");
  const [debouncedPasswordResetSearchEmail, setDebouncedPasswordResetSearchEmail] = useState("");
  const [passwordResetCandidates, setPasswordResetCandidates] = useState<ResetCandidateUser[]>([]);
  const [passwordResetSelectedEmail, setPasswordResetSelectedEmail] = useState("");
  const [isPasswordResetSearchLoading, setIsPasswordResetSearchLoading] = useState(false);
  const [passwordResetPassword, setPasswordResetPassword] = useState("");
  const [showPasswordResetPassword, setShowPasswordResetPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showSeededPassword, setShowSeededPassword] = useState(false);
  const [assignedRole, setAssignedRole] = useState(roles[0]?.value ?? "guest");
  const [approvalStatus, setApprovalStatus] = useState(statuses[0]?.value ?? "approved");
  const [preferredLocale, setPreferredLocale] = useState<(typeof locales)[number]["value"]>(locales[0]?.value ?? "es-MX");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuickSubmitting, setIsQuickSubmitting] = useState(false);
  const [isPasswordResetSubmitting, setIsPasswordResetSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  const resolveReasonMessage = (reason: string | undefined) => {
    switch (reason) {
      case "email-auth-disabled":
        return emailAuthDisabledErrorLabel;
      case "forbidden":
        return forbiddenErrorLabel;
      case "email-already-exists":
        return duplicateEmailErrorLabel;
      case "service-role-missing":
        return serviceRoleMissingErrorLabel;
      case "invalid-input":
        return invalidInputErrorLabel;
      case "email-not-found":
        return emailNotFoundErrorLabel;
      case "auth-user-update-failed":
        return genericErrorLabel;
      default:
        return genericErrorLabel;
    }
  };

  const resolveSessionToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setFeedback({ tone: "error", message: sessionErrorLabel });
      return null;
    }

    return session.access_token;
  }, [sessionErrorLabel, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedPasswordResetSearchEmail(passwordResetSearchEmail.trim().toLowerCase());
    }, PASSWORD_RESET_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [passwordResetSearchEmail]);

  useEffect(() => {
    let isCancelled = false;

    const fetchCandidates = async () => {
      if (!debouncedPasswordResetSearchEmail) {
        setPasswordResetCandidates([]);
        setIsPasswordResetSearchLoading(false);
        return;
      }

      setIsPasswordResetSearchLoading(true);
      const accessToken = await resolveSessionToken();
      if (!accessToken) {
        setIsPasswordResetSearchLoading(false);
        return;
      }

      const response = await fetch("/api/admin/users-directory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (!isCancelled) {
          setPasswordResetCandidates([]);
          setIsPasswordResetSearchLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as {
        ok: boolean;
        users?: Array<{ id: string; fullName: string | null; email: string | null }>;
      };

      if (!payload.ok || !payload.users) {
        if (!isCancelled) {
          setPasswordResetCandidates([]);
          setIsPasswordResetSearchLoading(false);
        }
        return;
      }

      const matches = payload.users
        .filter((user) => (user.email ?? "").toLowerCase().includes(debouncedPasswordResetSearchEmail))
        .filter((user) => Boolean(user.email))
        .map((user) => ({
          id: user.id,
          email: user.email ?? "",
          fullName: user.fullName,
        }))
        .slice(0, 20);

      if (!isCancelled) {
        setPasswordResetCandidates(matches);
        setIsPasswordResetSearchLoading(false);
      }
    };

    void fetchCandidates();

    return () => {
      isCancelled = true;
    };
  }, [debouncedPasswordResetSearchEmail, resolveSessionToken]);

  const onCreateUnauthorizedAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsQuickSubmitting(true);

    const accessToken = await resolveSessionToken();
    if (!accessToken) {
      setIsQuickSubmitting(false);
      return;
    }

    const response = await fetch("/api/admin/email-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: quickUnauthorizedEmail,
        password: quickUnauthorizedPassword,
        createUnauthorizedOnly: true,
      }),
    });

    const payload = (await response.json()) as EmailUserResponse;

    if (!response.ok || !payload.ok) {
      setFeedback({ tone: "error", message: resolveReasonMessage(payload.reason) });
      setIsQuickSubmitting(false);
      return;
    }

    setFeedback({
      tone: "success",
      message: quickUnauthorizedSuccessLabel.replace("{email}", payload.email ?? quickUnauthorizedEmail),
    });
    emitSuperadminPendingUsersRefresh();
    setQuickUnauthorizedEmail("");
    setQuickUnauthorizedPassword("");
    setIsQuickSubmitting(false);
  };

  const onResetPasswordByEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsPasswordResetSubmitting(true);

    const accessToken = await resolveSessionToken();
    if (!accessToken) {
      setIsPasswordResetSubmitting(false);
      return;
    }

    const response = await fetch("/api/admin/dev-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: passwordResetSelectedEmail,
        password: passwordResetPassword,
      }),
    });

    const payload = (await response.json()) as EmailUserResponse;

    if (!response.ok || !payload.ok) {
      setFeedback({ tone: "error", message: resolveReasonMessage(payload.reason) });
      setIsPasswordResetSubmitting(false);
      return;
    }

    setFeedback({
      tone: "success",
      message: passwordResetSuccessLabel.replace("{email}", payload.email ?? passwordResetSelectedEmail),
    });
    setPasswordResetSearchEmail("");
    setDebouncedPasswordResetSearchEmail("");
    setPasswordResetCandidates([]);
    setPasswordResetSelectedEmail("");
    setPasswordResetPassword("");
    setIsPasswordResetSubmitting(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    setIsSubmitting(true);

    const accessToken = await resolveSessionToken();
    if (!accessToken) {
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/admin/email-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email,
        fullName,
        password,
        assignedRole,
        approvalStatus,
        preferredLocale,
      }),
    });

    const payload = (await response.json()) as EmailUserResponse;

    if (!response.ok || !payload.ok) {
      setFeedback({ tone: "error", message: resolveReasonMessage(payload.reason) });
      setIsSubmitting(false);
      return;
    }

    setFeedback({ tone: "success", message: successLabel.replace("{email}", payload.email ?? email) });
    emitSuperadminPendingUsersRefresh();
    setPassword("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div>
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{subtitle}</p>
      </div>

      <form className="grid gap-3 rounded-xl border border-[#e4eef7] bg-[#f5fbff] p-4 md:grid-cols-[1fr_auto]" onSubmit={onCreateUnauthorizedAccount}>
        <div className="space-y-2">
          <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-base font-bold text-[#003F60]">{quickUnauthorizedTitle}</h2>
          <p className="text-sm text-[#2b5876]">{quickUnauthorizedSubtitle}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{emailLabel}</span>
              <input
                type="email"
                value={quickUnauthorizedEmail}
                onChange={(event) => setQuickUnauthorizedEmail(event.target.value)}
                placeholder={emailPlaceholder}
                className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
                autoComplete="email"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{quickUnauthorizedPasswordLabel}</span>
              <div className="relative">
                <input
                  type={showQuickPassword ? "text" : "password"}
                  value={quickUnauthorizedPassword}
                  onChange={(event) => setQuickUnauthorizedPassword(event.target.value)}
                  placeholder={quickUnauthorizedPasswordPlaceholder}
                  className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 pr-11 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowQuickPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b5876] transition hover:text-[#003F60]"
                  aria-label={showQuickPassword ? hidePasswordLabel : showPasswordLabel}
                >
                  {showQuickPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>
        </div>

        <div className="flex items-end md:pb-0.5">
          <AppButton type="submit" disabled={isQuickSubmitting} className="h-[42px] rounded-xl px-4 text-sm leading-5">
            {isQuickSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {quickUnauthorizedSubmittingLabel}
              </>
            ) : (
              quickUnauthorizedSubmitLabel
            )}
          </AppButton>
        </div>
      </form>

      <form className="grid gap-3 rounded-xl border border-[#e4eef7] bg-[#f5fbff] p-4 md:grid-cols-[1fr_auto]" onSubmit={onResetPasswordByEmail}>
        <div className="space-y-2">
          <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-base font-bold text-[#003F60]">{passwordResetTitle}</h2>
          <p className="text-sm text-[#2b5876]">{passwordResetSubtitle}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{passwordResetSearchEmailLabel}</span>
              <input
                type="email"
                value={passwordResetSearchEmail}
                onChange={(event) => {
                  setPasswordResetSearchEmail(event.target.value);
                  setPasswordResetSelectedEmail("");
                }}
                placeholder={passwordResetSearchEmailPlaceholder}
                className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
                autoComplete="email"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{passwordResetPasswordLabel}</span>
              <div className="relative">
                <input
                  type={showPasswordResetPassword ? "text" : "password"}
                  value={passwordResetPassword}
                  onChange={(event) => setPasswordResetPassword(event.target.value)}
                  placeholder={passwordResetPasswordPlaceholder}
                  className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 pr-11 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordResetPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b5876] transition hover:text-[#003F60]"
                  aria-label={showPasswordResetPassword ? hidePasswordLabel : showPasswordLabel}
                >
                  {showPasswordResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </label>
          </div>

          {passwordResetSearchEmail.trim().length > 0 ? (
            <p className="text-xs text-[#2b5876]">
              {isPasswordResetSearchLoading
                ? passwordResetSearchingLabel
                : passwordResetCandidates.length === 0
                  ? passwordResetNoMatchesLabel
                  : passwordResetSelectedEmail
                    ? passwordResetSelectedLabel.replace("{email}", passwordResetSelectedEmail)
                    : ""}
            </p>
          ) : null}

          {passwordResetCandidates.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#2b5876]">{passwordResetMatchesTitle}</p>
              <div className="overflow-x-auto rounded-lg border border-[#d6e8f6] bg-white">
                <table className="min-w-full text-sm">
                  <thead className="bg-[#f5fbff] text-left text-xs text-[#2b5876]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">{passwordResetMatchesEmailColumnLabel}</th>
                      <th className="px-3 py-2 font-semibold" />
                    </tr>
                  </thead>
                  <tbody>
                    {passwordResetCandidates.map((candidate) => (
                      <tr key={candidate.id} className="border-t border-[#eef4fa]">
                        <td className="px-3 py-2 text-[#003F60]">{candidate.email}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordResetSelectedEmail(candidate.email);
                              setPasswordResetSearchEmail(candidate.email);
                            }}
                            className="rounded-lg bg-[#36e7e1] px-3 py-1.5 text-xs font-semibold text-[#003F60] disabled:opacity-60"
                          >
                            {passwordResetMatchesActionLabel}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-end md:pb-0.5">
          <AppButton type="submit" disabled={isPasswordResetSubmitting || !passwordResetSelectedEmail} className="h-[42px] rounded-xl px-4 text-sm leading-5">
            {isPasswordResetSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {passwordResetSubmittingLabel}
              </>
            ) : (
              passwordResetSubmitLabel
            )}
          </AppButton>
        </div>
      </form>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{emailLabel}</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={emailPlaceholder}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
            autoComplete="email"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{fullNameLabel}</span>
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder={fullNamePlaceholder}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
            required
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{passwordLabel}</span>
          <div className="relative">
            <input
              type={showSeededPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={passwordPlaceholder}
              className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 pr-11 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowSeededPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b5876] transition hover:text-[#003F60]"
              aria-label={showSeededPassword ? hidePasswordLabel : showPasswordLabel}
            >
              {showSeededPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{localeLabel}</span>
          <select
            value={preferredLocale}
            onChange={(event) => setPreferredLocale(event.target.value as "es-MX" | "en-US")}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
          >
            {locales.map((localeOption) => (
              <option key={localeOption.value} value={localeOption.value}>
                {localeOption.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{roleLabel}</span>
          <select
            value={assignedRole}
            onChange={(event) => setAssignedRole(event.target.value)}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">{statusLabel}</span>
          <select
            value={approvalStatus}
            onChange={(event) => setApprovalStatus(event.target.value)}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
          >
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 flex items-center justify-end gap-3">
          <AppButton type="submit" disabled={isSubmitting} className="h-[42px] rounded-xl px-4 text-sm leading-5">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </AppButton>
        </div>
      </form>

      {feedback ? (
        <p className={feedback.tone === "error" ? "text-sm text-[#b51d3a]" : "text-sm text-[#0f5132]"}>{feedback.message}</p>
      ) : null}
    </div>
  );
}
