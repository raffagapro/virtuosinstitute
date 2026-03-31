import type { MessageKey } from "./i18n/messages/es-MX";
import esMX from "./i18n/messages/es-MX";
import enUS from "./i18n/messages/en-US";

export type Locale = "es-MX" | "en-US";

export const defaultLocale: Locale = "es-MX";

const messages: Record<Locale, Record<MessageKey, string>> = {
  "es-MX": esMX,
  "en-US": enUS,
};

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: Record<string, string | number>
): string {
  const msg = messages[locale][key] ?? messages[defaultLocale][key] ?? key;
  if (!params) return msg;
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    msg
  );
}
