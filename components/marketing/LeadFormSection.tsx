"use client";

import { useState, type FormEvent } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { AppButton } from "@/components/ui";
import { type Locale } from "@/lib/i18n";
import { useLocalization } from "@/lib/i18n/LocaleProvider";
import {
  leadFormSectionBackgroundStyle,
  leadFormSectionStyles as s,
} from "./LeadFormSection.styles";

interface LeadFormSectionProps {
  locale?: Locale;
}

export function LeadFormSection(_props: LeadFormSectionProps) {
  const { t } = useLocalization();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire to API route / email service
    setSubmitted(true);
  }

  return (
    <section id="contacto" className={s.section} style={leadFormSectionBackgroundStyle}>
      <div id="form" className={s.shell}>
        <div className={s.grid}>
          <div className={s.leftCol}>
            <p className={s.leftTitle}>
              {t("contacto.venLabel")}
            </p>

            <div className={s.leftInfoRow}>
              <Phone className={s.leftInfoIcon} size={22} />
              <a
                href={`tel:${t("contacto.phone").replace(/\s/g, "")}`}
                className={s.leftInfoLink}
              >
                {t("contacto.phone")}
              </a>
            </div>

            <div className={s.leftInfoRow}>
              <Mail className={s.leftInfoIcon} size={22} />
              <a
                href={`mailto:${t("contacto.email")}`}
                className={s.leftInfoLink}
              >
                {t("contacto.email")}
              </a>
            </div>

            <div className={s.leftInfoRow}>
              <MapPin className={s.leftInfoIcon} size={22} />
              <p className={s.leftInfoText}>
                {t("contacto.address")}
              </p>
            </div>

            <div className={s.mapWrap}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.7707097132247!2d-89.62016942491991!3d21.00182638064069!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f5676aba129e6f7%3A0xbce02127f81a067b!2sVirtu%C3%B3s%20Institute!5e0!3m2!1ses-419!2smx!4v1738124162742!5m2!1ses-419!2smx"
                width="100%"
                height="220"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t("contacto.mapTitle")}
              />
            </div>
          </div>

          <div className={s.rightCol}>
            <h2 className={s.rightHeading}>
              {t("leadForm.heading")}
            </h2>
            <p className={s.rightSubtext}>
              {t("leadForm.subtext")}
            </p>

            {submitted ? (
              <p className={s.success}>
                {t("leadForm.success")}
              </p>
            ) : (
              <form onSubmit={handleSubmit} className={s.form}>
                <label className="sr-only" htmlFor="lead-name">
                  {t("leadForm.namePlaceholder")}
                </label>
                <input
                  id="lead-name"
                  type="text"
                  name="name"
                  required
                  placeholder={t("leadForm.namePlaceholder")}
                  className={s.input}
                />

                <label className="sr-only" htmlFor="lead-student-age">
                  {t("leadForm.studentAgePlaceholder")}
                </label>
                <input
                  id="lead-student-age"
                  type="text"
                  name="studentAge"
                  required
                  placeholder={t("leadForm.studentAgePlaceholder")}
                  className={s.input}
                />

                <label className="sr-only" htmlFor="lead-phone">
                  {t("leadForm.phonePlaceholder")}
                </label>
                <input
                  id="lead-phone"
                  type="tel"
                  name="phone"
                  required
                  placeholder={t("leadForm.phonePlaceholder")}
                  className={s.input}
                />

                <label className="sr-only" htmlFor="lead-email">
                  {t("leadForm.emailPlaceholder")}
                </label>
                <input
                  id="lead-email"
                  type="email"
                  name="email"
                  required
                  placeholder={t("leadForm.emailPlaceholder")}
                  className={s.input}
                />

                <label className="sr-only" htmlFor="lead-message">
                  {t("leadForm.messagePlaceholder")}
                </label>
                <textarea
                  id="lead-message"
                  name="message"
                  rows={5}
                  placeholder={t("leadForm.messagePlaceholder")}
                  className={`${s.input} ${s.messageInputSpan}`}
                />

                <div className={s.buttonRow}>
                  <AppButton type="submit" className={s.button}>
                    {t("leadForm.cta")}
                  </AppButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
