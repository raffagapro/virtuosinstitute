"use client";

import { startTransition, useState } from "react";
import { AppFooter, AppNavbar } from "@/components/layout";
import { type Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { getMarketingSections } from "./sectionModules";

const homeSections = getMarketingSections();

interface HomePageShellProps {
  initialLocale: Locale;
}

export function HomePageShell({ initialLocale }: HomePageShellProps) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;

    startTransition(() => {
      setLocale(nextLocale);
    });
  }

  return (
    <LocaleProvider locale={locale}>
      <AppNavbar />
      <main>
        {homeSections.map(({ id, Component }) => (
          <Component key={id} locale={locale} />
        ))}
      </main>
      <AppFooter locale={locale} onLocaleChange={handleLocaleChange} />
    </LocaleProvider>
  );
}