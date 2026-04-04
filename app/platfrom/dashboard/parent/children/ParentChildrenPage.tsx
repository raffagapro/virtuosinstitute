"use client";

import { useState, useEffect } from "react";
import { BookOpen, Download } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isValidCurpFormat } from "@/lib/curp";

const GRADE_OPTIONS = [
  { value: "Kinder 1", label: "Kinder 1 (1° Preescolar)" },
  { value: "Kinder 2", label: "Kinder 2 (2° Preescolar)" },
  { value: "Kinder 3", label: "Kinder 3 (3° Preescolar)" },
  { value: "1° Primaria", label: "1° Primaria" },
  { value: "2° Primaria", label: "2° Primaria" },
  { value: "3° Primaria", label: "3° Primaria" },
  { value: "4° Primaria", label: "4° Primaria" },
  { value: "5° Primaria", label: "5° Primaria" },
  { value: "6° Primaria", label: "6° Primaria" },
];

interface ChildRecord {
  id: string;
  fullName: string;
  dateOfBirth: string | null;
  curp: string | null;
  gradeLevel: string | null;
  bloodType: string | null;
  allergies: string | null;
  dataAuthorizationSignedAt: string | null;
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
  enrollmentFormDownload: string;
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
    curpError: string;
    curpLookupLink: string;
    gradeLevel: string;
    gradeLevelDefaultOption: string;
    bloodType: string;
    bloodTypePlaceholder: string;
    allergies: string;
    allergiesPlaceholder: string;
    dataAuthorization: string;
    cancel: string;
    submit: string;
    submitting: string;
    error: string;
    errorForbidden: string;
    errorInvalidCurp: string;
    errorDuplicateCurp: string;
  };
  edit: {
    title: string;
    fullName: string;
    fullNamePlaceholder: string;
    dateOfBirth: string;
    curp: string;
    curpPlaceholder: string;
    curpError: string;
    curpLookupLink: string;
    gradeLevel: string;
    gradeLevelDefaultOption: string;
    bloodType: string;
    bloodTypePlaceholder: string;
    allergies: string;
    allergiesPlaceholder: string;
    cancel: string;
    save: string;
    saving: string;
    error: string;
    errorInvalidCurp: string;
    errorDuplicateCurp: string;
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
      return "bg-[#CCFBFA] text-[#003F60]";
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
  const [formBloodType, setFormBloodType] = useState("");
  const [formAllergies, setFormAllergies] = useState("");
  const [formDataAuthorization, setFormDataAuthorization] = useState(false);
  const [formCurpError, setFormCurpError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit modal state
  const [editingChild, setEditingChild] = useState<ChildRecord | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editCurp, setEditCurp] = useState("");
  const [editGradeLevel, setEditGradeLevel] = useState("");
  const [editBloodType, setEditBloodType] = useState("");
  const [editAllergies, setEditAllergies] = useState("");
  const [editCurpError, setEditCurpError] = useState<string | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
    setFormBloodType("");
    setFormAllergies("");
    setFormDataAuthorization(false);
    setFormCurpError(null);
    setFormError(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formDateOfBirth || !formCurp.trim() || !formGradeLevel.trim()) return;

    if (!isValidCurpFormat(formCurp)) {
      setFormCurpError(labels.form.curpError);
      return;
    }

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
          dateOfBirth: formDateOfBirth,
          curp: formCurp.trim(),
          gradeLevel: formGradeLevel.trim(),
          bloodType: formBloodType || null,
          allergies: formAllergies.trim() || null,
          dataAuthorization: formDataAuthorization,
        }),
      });

      if (!response.ok) {
        let reason = "unknown";
        try {
          const errJson = (await response.json()) as { reason?: string };
          reason = errJson.reason ?? "unknown";
        } catch { /* ignore parse error */ }
        console.error("[register-child] API error:", response.status, reason);
        if (reason === "forbidden") {
          setFormError(labels.form.errorForbidden);
        } else if (reason === "invalid-curp") {
          setFormCurpError(labels.form.errorInvalidCurp);
        } else if (reason === "duplicate-curp") {
          setFormCurpError(labels.form.errorDuplicateCurp);
        } else {
          setFormError(labels.form.error);
        }
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

  const handleEditChild = (child: ChildRecord) => {
    setEditingChild(child);
    setEditFullName(child.fullName);
    setEditDateOfBirth(child.dateOfBirth ?? "");
    setEditCurp(child.curp ?? "");
    setEditGradeLevel(child.gradeLevel ?? "");
    setEditBloodType(child.bloodType ?? "");
    setEditAllergies(child.allergies ?? "");
    setEditCurpError(null);
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingChild(null);
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild || !editFullName.trim() || !editDateOfBirth || !editCurp.trim() || !editGradeLevel.trim()) return;

    if (!isValidCurpFormat(editCurp)) {
      setEditCurpError(labels.edit.curpError);
      return;
    }

    try {
      setIsEditSubmitting(true);
      setEditError(null);

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setEditError(labels.edit.error);
        return;
      }

      const response = await fetch(`/api/parent/children/${editingChild.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          dateOfBirth: editDateOfBirth,
          curp: editCurp.trim(),
          gradeLevel: editGradeLevel.trim(),
          bloodType: editBloodType || null,
          allergies: editAllergies.trim() || null,
        }),
      });

      if (!response.ok) {
        let reason = "unknown";
        try {
          const errJson = (await response.json()) as { reason?: string };
          reason = errJson.reason ?? "unknown";
        } catch { /* ignore */ }
        if (reason === "invalid-curp") {
          setEditCurpError(labels.edit.errorInvalidCurp);
        } else if (reason === "duplicate-curp") {
          setEditCurpError(labels.edit.errorDuplicateCurp);
        } else {
          setEditError(labels.edit.error);
        }
        return;
      }

      setEditingChild(null);
      await fetchChildren();
    } catch {
      setEditError(labels.edit.error);
    } finally {
      setIsEditSubmitting(false);
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
          <div className="flex items-center gap-2">
            <div className="relative group">
              <a
                href="/enrollment-form.pdf"
                download
                aria-label={labels.enrollmentFormDownload}
                className="inline-flex items-center justify-center rounded-xl bg-[#fa4361] p-2 text-white transition hover:bg-[#e33354] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#fa4361]"
              >
                <Download className="h-4 w-4" />
              </a>
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#003F60] px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                {labels.enrollmentFormDownload}
              </span>
            </div>
            <button
              onClick={handleAddChild}
              className="rounded-xl bg-[#003F60] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00527a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
            >
              {labels.addButton}
            </button>
          </div>
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
                {labels.form.fullName} <span className="text-red-500">*</span>
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
                {labels.form.dateOfBirth} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formDateOfBirth}
                onChange={(e) => setFormDateOfBirth(e.target.value)}
                required
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.gradeLevel} <span className="text-red-500">*</span>
              </label>
              <select
                name="gradeLevel"
                value={formGradeLevel}
                onChange={(e) => setFormGradeLevel(e.target.value)}
                required
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              >
                <option value="">{labels.form.gradeLevelDefaultOption}</option>
                {GRADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.curp} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formCurp}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setFormCurp(val);
                  if (formCurpError && isValidCurpFormat(val)) {
                    setFormCurpError(null);
                  }
                }}
                onBlur={() => {
                  if (formCurp.trim()) {
                    setFormCurpError(
                      isValidCurpFormat(formCurp) ? null : labels.form.curpError
                    );
                  }
                }}
                placeholder={labels.form.curpPlaceholder}
                maxLength={18}
                required
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm uppercase text-[#003F60] placeholder-[#7aa8c4] focus:outline-none focus:ring-1 focus:ring-[#36e7e1] ${
                  formCurpError
                    ? "border-red-400 focus:border-red-400"
                    : "border-[#d6e8f6] focus:border-[#36e7e1]"
                }`}
              />
              {formCurpError && (
                <p className="mt-1 text-xs text-red-600" role="alert">{formCurpError}</p>
              )}
              <a
                href="https://www.gob.mx/curp/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-[#0070c0] underline hover:text-[#005a9e] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#36e7e1]"
              >
                {labels.form.curpLookupLink}
              </a>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.bloodType}
              </label>
              <select
                value={formBloodType}
                onChange={(e) => setFormBloodType(e.target.value)}
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
              >
                <option value="">{labels.form.bloodTypePlaceholder}</option>
                {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-[#003F60]">
                {labels.form.allergies}
              </label>
              <textarea
                value={formAllergies}
                onChange={(e) => setFormAllergies(e.target.value)}
                placeholder={labels.form.allergiesPlaceholder}
                rows={3}
                className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1] resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formDataAuthorization}
                  onChange={(e) => setFormDataAuthorization(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-[#d6e8f6] accent-[#003F60]"
                />
                <span className="text-xs leading-relaxed text-[#2b5876]">
                  {labels.form.dataAuthorization}
                </span>
              </label>
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
              disabled={isSubmitting || !formFullName.trim() || !formDateOfBirth || !formCurp.trim() || !formGradeLevel.trim() || !!formCurpError || !formDataAuthorization}
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
              className="rounded-xl border border-[#36e7e1]/40 bg-[#E0FFFE] px-4 py-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#36e7e1] text-[#003F60]">
                    <BookOpen className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <button
                      type="button"
                      onClick={() => handleEditChild(child)}
                      className="font-medium text-[#003F60] underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B] rounded"
                    >
                      {child.fullName}
                    </button>
                    {child.gradeLevel && (
                      <p className="mt-0.5 text-xs text-[#2b5876]">{child.gradeLevel}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(child.approvalStatus === "pending" || child.approvalStatus === "rejected" || child.approvalStatus === "suspended") && (
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(child.approvalStatus)}`}
                    >
                      {statusLabel(child.approvalStatus)}
                    </span>
                  )}
                  {/* future: tuition / utility buttons */}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editingChild && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) handleEditCancel(); }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-[#d6e8f6] bg-white p-5 shadow-xl sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-[#003F60]">{labels.edit.title}</h2>

            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.fullName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    placeholder={labels.edit.fullNamePlaceholder}
                    required
                    className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.dateOfBirth} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => setEditDateOfBirth(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.gradeLevel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editGradeLevel}
                    onChange={(e) => setEditGradeLevel(e.target.value)}
                    required
                    className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
                  >
                    <option value="">{labels.edit.gradeLevelDefaultOption}</option>
                    {GRADE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.curp} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editCurp}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditCurp(val);
                      if (editCurpError && isValidCurpFormat(val)) setEditCurpError(null);
                    }}
                    onBlur={() => {
                      if (editCurp.trim()) {
                        setEditCurpError(isValidCurpFormat(editCurp) ? null : labels.edit.curpError);
                      }
                    }}
                    placeholder={labels.edit.curpPlaceholder}
                    maxLength={18}
                    required
                    className={`w-full rounded-lg border bg-white px-3 py-2 text-sm uppercase text-[#003F60] placeholder-[#7aa8c4] focus:outline-none focus:ring-1 focus:ring-[#36e7e1] ${
                      editCurpError
                        ? "border-red-400 focus:border-red-400"
                        : "border-[#d6e8f6] focus:border-[#36e7e1]"
                    }`}
                  />
                  {editCurpError && (
                    <p className="mt-1 text-xs text-red-600" role="alert">{editCurpError}</p>
                  )}
                  <a
                    href="https://www.gob.mx/curp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-[#0070c0] underline hover:text-[#005a9e] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#36e7e1]"
                  >
                    {labels.edit.curpLookupLink}
                  </a>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.bloodType}
                  </label>
                  <select
                    value={editBloodType}
                    onChange={(e) => setEditBloodType(e.target.value)}
                    className="w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
                  >
                    <option value="">{labels.edit.bloodTypePlaceholder}</option>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-[#003F60]">
                    {labels.edit.allergies}
                  </label>
                  <textarea
                    value={editAllergies}
                    onChange={(e) => setEditAllergies(e.target.value)}
                    placeholder={labels.edit.allergiesPlaceholder}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] placeholder-[#7aa8c4] focus:border-[#36e7e1] focus:outline-none focus:ring-1 focus:ring-[#36e7e1]"
                  />
                </div>
              </div>

              {editError && (
                <p className="mt-3 text-sm text-red-600" role="alert">{editError}</p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={isEditSubmitting || !editFullName.trim() || !editDateOfBirth || !editCurp.trim() || !editGradeLevel.trim() || !!editCurpError}
                  className="rounded-xl bg-[#003F60] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#00527a] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
                >
                  {isEditSubmitting ? labels.edit.saving : labels.edit.save}
                </button>
                <button
                  type="button"
                  onClick={handleEditCancel}
                  disabled={isEditSubmitting}
                  className="rounded-xl border border-[#d6e8f6] bg-white px-4 py-2 text-sm font-medium text-[#003F60] transition hover:bg-[#f0f7ff] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#36e7e1]"
                >
                  {labels.edit.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
