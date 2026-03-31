import Image from "next/image";
import { AppContactInfoGroup, AppSocialLinks } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";
import { appFooterStyles as s } from "./AppFooter.styles";

interface AppFooterProps {
  locale?: Locale;
}

export function AppFooter({ locale = "es-MX" }: AppFooterProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [addressLine1, ...addressRest] = t("leadForm.address").split(", ");
  const addressLine2 = addressRest.join(", ");

  return (
    <footer className={s.footer}>
      <div className={s.grid}>
        <AppContactInfoGroup
          title={t("leadForm.phoneLabel")}
          className={s.leftCol}
          titleClassName={s.label}
        >
          <a
            href={`tel:${t("contacto.phone").replace(/\s/g, "")}`}
            className={s.phoneLink}
          >
            {t("contacto.phone")}
          </a>
          <p className={s.address}>
            {addressLine1},
            <br />
            {addressLine2}
          </p>
        </AppContactInfoGroup>

        <AppContactInfoGroup
          title={t("leadForm.emailLabel")}
          className={s.middleCol}
          titleClassName={s.label}
        >
          <a
            href={`mailto:${t("contacto.email")}`}
            className={s.emailLink}
          >
            {t("contacto.email")}
          </a>
          <AppSocialLinks wrapperClassName={s.socialWrapper} linkClassName={s.socialLink} />
        </AppContactInfoGroup>

        <div className={s.logoCol}>
          <Image
            src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-1virtuos-logo.png"
            alt="Virtuós Institute"
            width={220}
            height={209}
            className={s.logoImg}
            unoptimized
          />
        </div>
      </div>
    </footer>
  );
}
