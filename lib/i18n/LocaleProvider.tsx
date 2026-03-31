"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultLocale, type Locale, translate } from "@/lib/i18n";

type TranslateKey = Parameters<typeof translate>[1];

type LocalizationContextValue = {
  locale: Locale;
  t: (key: TranslateKey, params?: Record<string, string | number>) => string;
};

const LocalizationContext = createContext<LocalizationContextValue>({
  locale: defaultLocale,
  t: (key, params) => translate(defaultLocale, key, params),
});

interface LocaleProviderProps {
  locale: Locale;
  children: ReactNode;
}

export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo<LocalizationContextValue>(
    () => ({
      locale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale]
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  return useContext(LocalizationContext);
}
