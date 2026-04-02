"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { AppContactInfoGroup, AppSocialLinks } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";
import { appFooterStyles as s } from "./AppFooter.styles";

interface AppFooterProps {
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  compact?: boolean;
}

const localeOptions: Locale[] = ["es-MX", "en-US"];

export function AppFooter({ locale = "es-MX", onLocaleChange, compact = false }: AppFooterProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [addressLine1, ...addressRest] = t("leadForm.address").split(", ");
  const addressLine2 = addressRest.join(", ");

  return (
    <footer className={cn(s.footer, compact && s.footerCompact, "mt-auto")}>
      <div className={cn(s.grid, compact && s.gridCompact)}>
        <AppContactInfoGroup
          title={t("leadForm.phoneLabel")}
          className={cn(s.leftCol, compact && s.leftColCompact)}
          titleClassName={s.label}
        >
          <a
            href={`tel:${t("contacto.phone").replace(/\s/g, "")}`}
            className={s.phoneLink}
          >
            {t("contacto.phone")}
          </a>
          <p className={cn(s.address, compact && s.addressCompact)}>
            {addressLine1},
            <br />
            {addressLine2}
          </p>
        </AppContactInfoGroup>

        <AppContactInfoGroup
          title={t("leadForm.emailLabel")}
          className={cn(s.middleCol, compact && s.middleColCompact)}
          titleClassName={s.label}
        >
          <a
            href={`mailto:${t("contacto.email")}`}
            className={s.emailLink}
          >
            {t("contacto.email")}
          </a>
          <div className={cn(s.socialRow, compact && s.socialRowCompact)}>
            <AppSocialLinks
              wrapperClassName={cn(s.socialWrapper, compact && s.socialWrapperCompact)}
              linkClassName={s.socialLink}
            />
            <div className={s.localeSwitcher} role="group" aria-label={t("footer.languageSwitcherAria")}>
              {localeOptions.map((localeOption) => {
                const isActive = localeOption === locale;
                const shortLabel = localeOption === "es-MX" ? t("footer.locale.esShort") : t("footer.locale.enShort");
                const ariaLabel = localeOption === "es-MX" ? t("footer.switchToEsAria") : t("footer.switchToEnAria");

                return (
                  <button
                    key={localeOption}
                    type="button"
                    aria-label={ariaLabel}
                    aria-pressed={isActive}
                    onClick={() => onLocaleChange?.(localeOption)}
                    className={cn(s.localeButton, isActive ? s.localeButtonActive : s.localeButtonInactive)}
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </AppContactInfoGroup>

        <div className={cn(s.logoCol, compact && s.logoColCompact)}>
          <Image
            src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-1virtuos-logo.png"
            alt={t("footer.tagline")}
            width={220}
            height={209}
            className={cn(s.logoImg, compact && s.logoImgCompact)}
            unoptimized
          />
        </div>
      </div>
    </footer>
  );
}
