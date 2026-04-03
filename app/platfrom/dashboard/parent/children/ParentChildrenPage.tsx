"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface ChildRecord {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  curp: string | null;
  gradeLevel: string | null;
  approvalStatus: string;
  onboardingStatus: string;
}

interface Labels {
  title: string;
  subtitle: string;
  loading: string;
  error: string;
  empty: string;
  addButton: string;
  status: {
    pending: string;
    approved: string;
    rejected: string;
    suspended: string;
  };
  form: {
    title: string;
    fullName: string;
    fullNamePlaceholder: string;
    dateOfBirth: string;
    curp: string;
    curpPlaceholder: string;
    gradeLevel: string;
    gradeLevelPlaceholder: string;
    cancel: string;
    submit: string;
    submitting: string;
    error: string;
  };
}

interface ParentChildrenPageProps {
  labels: Labels;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-[#d6e8f6] text-[#003F60]";
  }
}

export function ParentChildrenPage({ labels }: ParentChildrenPageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formFullName, setFormFullName] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formCurp, setFormCurp] = useState("");
  const [formGradeLevel, setFormGradeLevel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchChildren = async () => {
    try {
      setIsLoading(true);
      setHasError(false);

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setHasError(true);
        return;
      }

      const response = await fetch("/api/parent/children", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        setHasError(true);
        return;
      }

      const json = (await response.json()) as { ok: boolean; children?: ChildRecord[] };
      if (!json.ok) {
        setHasError(true);
        return;
      }

      setChildren(json.children ?? []);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchChildren();
  }, []);

  const handleAddChild = () => {
    setFormFullName("");
    setFormDateOfBirth("");
    setFormCurp("");
    setFormGradeLevel("");
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;

    try {
      setIsSubmitting(true);
      setFormError(null);

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setFormError(labels.form.error);
        return;
      }

      const response = await fetch("/api/parent/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: formFullName.trim(),
          dateOfBirth: formDateOfBirth || null,
          curp: formCurp.trim() || null,
          gradeLevel: formGradeLevel.trim() || null,
        }),
      });

      if (!response.ok) {
        setFormError(labels.form.error);
        return;
      }

      const json = (await response.json()) as { ok: boolean };
      if (!json.ok) {
        setFormError(labels.form.error);
        return;
      }

      setShowForm(false);
      await fetchChildren();
    } catch {
      setFormError(labels.form.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusLabel = (status: string): string => {
    return labels.status[status as keyof typeof labels.status] ?? status;
  };

  return (
    <div className="space-y-6 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
            {labels.title}
          </h1>
          <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{labels.subtitle}</p>
        </div>
        {!showForm && (
          <button
            onClick={handleAddChild}
            className="rounded-xl bg-[#003F60] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00527a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
          >
            {labels.addButton}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#d6e8f6] bg-[#f0f7ff] p-4 sm:p-5"
        >
          <h2 className="mb-4 text-base font-semibold text-[#003F60]">{labels.form.title}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.fullName}
              </label>
              <input
                type="text"
                value={formFullName}
                onChange={(e) => setFormFullName(e.target.value)}
                placeholder={labels.form.fullNamePlaceholder}
                required
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.dateOfBirth}
              </label>
              <input
                type="date"
                value={formDateOfBirth}
                onChange={(e) => setFormDateOfBirth(e.target.value)}
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.gradeLevel}
              </label>
              <input
                type="text"
                value={formGradeLevel}
                onChange={(e) => setFormGradeLevel(e.target.value)}
                placeholder={labels.form.gradeLevelPlaceholder}
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.curp}
              </label>
              <input
                type="text"
                value={formCurp}
                onChange={(e) => setFormCurp(e.target.value.toUpperCase())}
                placeholder={labels.form.curpPlaceholder}
                maxLength={18}
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm uppercase text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting || !formFullName.trim()}
              className="rounded-xl bg-[#003F60] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00527a] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
            >
              {isSubmitting ? labels.form.submitting : labels.form.submit}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-[#d6e8f6] bg-white px-4 py-2 text-sm font-medium text-[#003F60] transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
            >
              {labels.form.cancel}
            </button>
          </div>
        </form>
      )}

      {isLoading && (
        <p className="text-sm text-[#2b5876]">{labels.loading}</p>
      )}

      {!isLoading && hasError && (
        <p className="text-sm text-red-600" role="alert">
          {labels.error}
        </p>
      )}

      {!isLoading && !hasError && children.length === 0 && (
        <p className="text-sm text-[#2b5876]">{labels.empty}</p>
      )}

      {!isLoading && !hasError && children.length > 0 && (
        <ul className="space-y-3">
          {children.map((child) => (
            <li
              key={child.id}
              className="rounded-xl border border-[#d6e8f6] bg-[#f0f7ff] px-4 py-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-[#003F60]">{child.fullName}</p>
                  {child.gradeLevel && (
                    <p className="mt-0.5 text-xs text-[#2b5876]">{child.gradeLevel}</p>
                  )}
                </div>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(child.approvalStatus)}`}
                >
                  {statusLabel(child.approvalStatus)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
