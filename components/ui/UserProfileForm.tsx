"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface ProfileData {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  preferredLocale: string;
  platformRole: string | null;
}

interface UserProfileFormProps {
  isParent: boolean;
  locale: Locale;
  labels: {
    title: string;
    subtitle: string;
    fullName: string;
    email: string;
    phone: string;
    phonePlaceholder?: string;
    preferredLocale: string;
    curp: string;
    rfc: string;
    profession: string;
    invoiceRequired: string;
    dateOfBirth: string;
    edit: string;
    save: string;
    cancel: string;
    saving: string;
    language: string;
    loading: string;
    error: string;
  };
}

export function UserProfileForm({ isParent, locale, labels }: UserProfileFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    preferredLocale: locale,
    curp: "",
    rfc: "",
    profession: "",
    invoiceRequired: false,
    dateOfBirth: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get the access token from Supabase
        const supabase = getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error("Not authenticated - no session found");
        }

        const response = await fetch("/api/user/profile", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || `Failed to fetch profile (${response.status})`);
        }
        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.error || "API returned error");
        }
        if (data.profile) {
          setProfile(data.profile);
          setFormData((prev) => ({
            ...prev,
            fullName: data.profile.fullName,
            phone: data.profile.phone || "",
            dateOfBirth: data.profile.dateOfBirth || "",
            preferredLocale: data.profile.preferredLocale,
          }));
          if (data.parentProfile) {
            setFormData((prev) => ({
              ...prev,
              curp: data.parentProfile.curp,
              rfc: data.parentProfile.rfc || "",
              profession: data.parentProfile.profession || "",
              invoiceRequired: data.parentProfile.invoiceRequired,
              dateOfBirth: prev.dateOfBirth || data.parentProfile.dateOfBirth || "",
            }));
          }
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err instanceof Error ? err.message : "Error loading profile");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Get the access token from Supabase
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated - no session found");
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          preferredLocale: formData.preferredLocale,
          dateOfBirth: formData.dateOfBirth,
          ...(isParent
            ? {
                curp: formData.curp,
                rfc: formData.rfc,
                profession: formData.profession,
                invoiceRequired: formData.invoiceRequired,
              }
            : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to update profile");
      }

      const data = await response.json();
      if (data.ok) {
        setProfile(data.profile);

        window.dispatchEvent(
          new CustomEvent("app:profile-updated", {
            detail: {
              fullName: data.profile?.fullName ?? formData.fullName,
              email: data.profile?.email ?? profile?.email ?? null,
            },
          })
        );

        setIsEditing(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
        <div className="mb-6">
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
            {labels.title}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#eef4fa] border-t-[#fa4361]" />
          <p className="text-sm text-[#2b5876]">{labels.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">
            {labels.title}
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg bg-[#fa4361] px-4 py-2 text-sm font-medium text-white hover:bg-[#e63450]"
          >
            {labels.edit}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {labels.error}: {error}
        </div>
      )}

      <form className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-[#003F60]">
            {labels.fullName}
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            disabled={!isEditing}
            className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-[#003F60]">
            {labels.email}
          </label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#999] bg-[#f5fbff]"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[#003F60]">
            {labels.phone}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder={labels.phonePlaceholder}
            disabled={!isEditing}
            className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
          />
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-[#003F60]">
            {labels.dateOfBirth}
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            disabled={!isEditing}
            className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
          />
        </div>

        {/* Preferred Locale */}
        <div>
          <label className="block text-sm font-medium text-[#003F60]">
            {labels.language}
          </label>
          <select
            name="preferredLocale"
            value={formData.preferredLocale}
            onChange={handleChange}
            disabled={!isEditing}
            className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
          >
            <option value="es-MX">Español</option>
            <option value="en-US">English</option>
          </select>
        </div>

        {/* Parent-specific fields */}
        {isParent && (
          <>
            <hr className="my-6 border-[#eef4fa]" />

            {/* CURP */}
            <div>
              <label className="block text-sm font-medium text-[#003F60]">
                {labels.curp}
              </label>
              <input
                type="text"
                name="curp"
                value={formData.curp}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
              />
            </div>

            {/* RFC */}
            <div>
              <label className="block text-sm font-medium text-[#003F60]">
                {labels.rfc}
              </label>
              <input
                type="text"
                name="rfc"
                value={formData.rfc}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
              />
            </div>

            {/* Profession */}
            <div>
              <label className="block text-sm font-medium text-[#003F60]">
                {labels.profession}
              </label>
              <input
                type="text"
                name="profession"
                value={formData.profession}
                onChange={handleChange}
                disabled={!isEditing}
                className="mt-2 w-full rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff] disabled:text-[#999]"
              />
            </div>

            {/* Invoice Required */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="invoiceRequired"
                name="invoiceRequired"
                checked={formData.invoiceRequired}
                onChange={handleChange}
                disabled={!isEditing}
                className="h-4 w-4 cursor-pointer rounded border-[#d6e8f6] text-[#fa4361] disabled:bg-[#f5fbff]"
              />
              <label htmlFor="invoiceRequired" className="ml-3 text-sm font-medium text-[#003F60]">
                {labels.invoiceRequired}
              </label>
            </div>
          </>
        )}

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-[#fa4361] px-6 py-2 text-sm font-medium text-white hover:bg-[#e63450] disabled:opacity-50"
            >
              {isSaving ? labels.saving : labels.save}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="rounded-lg border border-[#d6e8f6] px-6 py-2 text-sm font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-50"
            >
              {labels.cancel}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
