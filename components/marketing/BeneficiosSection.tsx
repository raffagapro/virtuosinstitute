import Image from "next/image";
import { AppSectionLabel } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";

const BASE = "https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/";
const BASE_ICONS = "https://virtuosinstitute.com.mx/wp-content/uploads/2025/";

const beneficios = [
  {
    titleKey: "beneficios.1.title",
    descKey: "beneficios.1.desc",
    img: `${BASE}teo-zac-T-JRj7aV0hQ-unsplash-480x320.jpg`,
    icon: `${BASE_ICONS}01/cap-education-hat-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.2.title",
    descKey: "beneficios.2.desc",
    img: `${BASE}Recurso-11virtuos-480x327.jpg`,
    icon: `${BASE_ICONS}02/chatting-talk-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.3.title",
    descKey: "beneficios.3.desc",
    img: `${BASE}Recurso-9virtuos-480x327.jpg`,
    icon: `${BASE_ICONS}01/happy-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.4.title",
    descKey: "beneficios.4.desc",
    img: `${BASE}jason-sung-xH04gkmk1sg-unsplash-480x320.jpg`,
    icon: `${BASE_ICONS}01/education-laboratory-school-2-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.5.title",
    descKey: "beneficios.5.desc",
    img: `${BASE}Recurso-10virtuos-480x327.jpg`,
    icon: `${BASE_ICONS}02/brain-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.6.title",
    descKey: "beneficios.6.desc",
    img: `${BASE}javier-trueba-vFJNeWJAA2g-unsplash-480x320.jpg`,
    icon: `${BASE_ICONS}02/collaboration-team-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.7.title",
    descKey: "beneficios.7.desc",
    img: `${BASE}brittani-burns-3dbvtbqsdvo-unsplash-480x320.jpg`,
    icon: `${BASE_ICONS}02/business-briefcase-svgrepo-com-150x150.png`,
  },
  {
    titleKey: "beneficios.8.title",
    descKey: "beneficios.8.desc",
    img: `${BASE}Recurso-9virtuos-480x327.jpg`,
    icon: `${BASE_ICONS}02/drawing-svgrepo-com-150x150.png`,
  },
] as const;

interface BeneficiosSectionProps {
  locale?: Locale;
}

export function BeneficiosSection({ locale = "es-MX" }: BeneficiosSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <section className="relative bg-[#002B50] py-20" id="beneficios">
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Mesa-de-trabajo-5virtuos-bg4.jpg"
          alt=""
          fill
          className="object-cover object-center"
          unoptimized
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <div className="flex flex-col items-center text-center gap-3">
          <AppSectionLabel className="text-base md:text-lg font-extrabold tracking-normal">{t("beneficios.sectionLabel")}</AppSectionLabel>
          <h2 className="font-['Sora',Helvetica,Arial,sans-serif] font-bold text-white text-3xl md:text-4xl">
            {t("beneficios.heading")}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {beneficios.map(({ titleKey, descKey, img, icon }) => (
            <div
              key={titleKey}
              className="flex h-full min-h-[470px] flex-col overflow-hidden"
            >
              {/* Card image */}
              <div className="relative h-48 w-full">
                <Image
                  src={img}
                  alt={t(titleKey)}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Overlapping white icon badge */}
              <div className="relative z-10 -mt-[48px] mb-0 ml-[30px] inline-flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <Image
                  src={icon}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                />
              </div>

              {/* Dark content container */}
              <div className="-mt-[42px] flex flex-1 flex-col bg-[#003F60]">
                <div className="px-[30px] pt-[70px] pb-[10px]">
                  <h3 className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[23px] leading-[1.2] text-white transition-colors duration-300 hover:text-[#ffc704]">
                    {t(titleKey)}
                  </h3>
                </div>

                <div className="min-h-[72px] px-[19px] pt-[9px] pb-[20px]">
                  <p className="flex items-start gap-2 font-['Sora',Helvetica,Arial,sans-serif] text-[16px] leading-[1.2] text-[#b8b9d5]">
                    <span aria-hidden="true" className="mt-[2px] text-[14px] text-[#ffc606]">✓</span>
                    <span>{t(descKey)}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
