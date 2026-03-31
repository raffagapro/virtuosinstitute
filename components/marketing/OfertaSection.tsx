import { AppCheckItem, AppSectionHeading } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";

interface OfertaSectionProps {
  locale?: Locale;
}

type ProgramTone = "dark" | "light";

const programs = [
  {
    id: "kinder",
    titleKey: "oferta.kinder.title",
    descKey: "oferta.kinder.desc",
    activityKeys: ["oferta.kinder.actividad1", "oferta.kinder.actividad2"] as const,
    imageUrl:
      "https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/WhatsApp-Image-2025-02-10-at-12.34.53-PM-1.jpeg",
    tone: "light" as ProgramTone,
    showActivitiesLabel: true,
  },
  {
    id: "primaria",
    titleKey: "oferta.primaria.title",
    descKey: "oferta.primaria.desc",
    activityKeys: [
      "oferta.primaria.actividad1",
      "oferta.primaria.actividad2",
      "oferta.primaria.actividad3",
    ] as const,
    imageUrl:
      "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/WhatsApp-Image-2025-01-24-at-2.03.00-PM-2.jpeg",
    tone: "dark" as ProgramTone,
    showActivitiesLabel: false,
  },
] as const;

export function OfertaSection({ locale = "es-MX" }: OfertaSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <section className="bg-white py-20" id="oferta-educativa">
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <AppSectionHeading
          label={t("oferta.sectionLabel")}
          title={t("oferta.heading")}
          labelClassName="text-[16px] text-[#37E8E2]"
          titleClassName="text-[43px] text-[#00197e] leading-[1.25em]"
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {programs.map(({ id, titleKey, descKey, activityKeys, imageUrl, tone, showActivitiesLabel }) => {
            const isDark = tone === "dark";

            return (
              <div
                key={id}
                className={[
                  "flex flex-col gap-5 rounded-2xl p-8",
                  isDark ? "bg-[#002b50] text-white" : id === "kinder" ? "bg-[#f6f6f6]" : "bg-white",
                ].join(" ")}
              >
                <div
                  className="mt-9 h-[220px] overflow-hidden rounded-[10px] bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />

                <h3
                  className={[
                    "relative mb-[17px] inline-flex w-fit items-center overflow-visible rounded-r-[30px] bg-white py-4 pr-[30px] pl-0 font-['Sora',sans-serif] text-[22px] leading-[1em] text-[#00197e] before:absolute before:top-0 before:right-[calc(100%-1px)] before:h-full before:w-[36px] before:bg-white before:content-['']",
                    id === "kinder" ? "border-l-[3px] border-l-[#37E8E2] before:border-l-[3px] before:border-l-[#37E8E2]" : "border-l-0 before:border-l-0",
                  ].join(" ")}
                >
                  {t(titleKey)}
                </h3>

                <p
                  className={[
                    "mb-[10px] font-['Sora',Helvetica,Arial,sans-serif] text-[16px] font-medium leading-[1.6em]",
                    isDark ? "text-white/80" : "text-[#666]",
                  ].join(" ")}
                >
                  {t(descKey)}
                </p>

                <div className="mt-2 flex flex-col gap-2">
                  <ul className="flex flex-col gap-2">
                    {[
                      ...(showActivitiesLabel ? (["oferta.kinder.actividadesLabel"] as const) : []),
                      ...activityKeys,
                    ].map((key) => (
                      <AppCheckItem
                        key={key}
                        as="li"
                        className={isDark ? "text-white/80" : "text-[#666]"}
                        textClassName={[
                          "text-[16px] font-medium leading-[1.6em]",
                          isDark ? "text-white/80" : "text-[#666]",
                        ].join(" ")}
                      >
                        {t(key)}
                      </AppCheckItem>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
