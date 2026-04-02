"use client";

import { UserProfileForm } from "@/components/ui";
import { defaultLocale, translate, type Locale } from "@/lib/i18n";

interface SharedProfilePageProps {
  expectedPath: string;
  isParent: boolean;
}

export function SharedProfilePage({ expectedPath, isParent }: SharedProfilePageProps) {
  const locale = defaultLocale;

  return (
    <UserProfileForm
      isParent={isParent}
      locale={locale}
      labels={{
        title: translate(locale, "platform.profile.title"),
        subtitle: translate(locale, "platform.profile.subtitle"),
        fullName: translate(locale, "platform.profile.fullName"),
        email: translate(locale, "platform.profile.email"),
        phone: translate(locale, "platform.profile.phone"),
        preferredLocale: translate(locale, "platform.profile.language"),
        curp: translate(locale, "platform.profile.curp"),
        rfc: translate(locale, "platform.profile.rfc"),
        profession: translate(locale, "platform.profile.profession"),
        invoiceRequired: translate(locale, "platform.profile.invoiceRequired"),
        dateOfBirth: translate(locale, "platform.profile.dateOfBirth"),
        language: translate(locale, "platform.profile.language"),
        edit: translate(locale, "platform.profile.edit"),
        save: translate(locale, "platform.profile.save"),
        cancel: translate(locale, "platform.profile.cancel"),
        saving: translate(locale, "platform.profile.saving"),
        loading: translate(locale, "platform.profile.loading"),
        error: translate(locale, "platform.profile.error"),
      }}
    />
  );
}
