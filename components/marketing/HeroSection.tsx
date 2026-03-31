import Image from "next/image";
import { AppButton } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";

interface HeroSectionProps {
  locale?: Locale;
}

export function HeroSection({ locale = "es-MX" }: HeroSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const headline = t("hero.headline");
  const highlightPhrase = "experiencia única 🌟";
  const featureCards = [
    {
      titleKey: "nav.academica" as const,
      bodyKey: "hero.card.academica.desc" as const,
      icon:
        "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/cap-education-hat-svgrepo-com-150x150.png",
    },
    {
      titleKey: "nav.artistica" as const,
      bodyKey: "hero.card.artistica.desc" as const,
      icon:
        "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/drawing-svgrepo-com-150x150.png",
    },
    {
      titleKey: "nav.socioemocional" as const,
      bodyKey: "hero.card.socioemocional.desc" as const,
      icon:
        "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/happy-svgrepo-com-150x150.png",
    },
  ];

  return (
    <>
    <section id="inicio" className="relative z-20 bg-white pt-[70px]">
      {/* Full hero background image */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Mesa-de-trabajo-5virtuos-bg2.jpg"
          alt=""
          fill
          className="object-cover object-center"
          unoptimized
          priority
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 flex flex-col-reverse md:flex-row items-center min-h-[90vh]">
        {/* Text column */}
        <div className="flex-1 py-16 md:py-0 flex flex-col items-start gap-7 z-10">
          <div className="pb-9 max-w-[45%]">
            <Image
              src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-6virtuos-logo-980x380.png"
              alt="Virtuós Institute"
              width={1016}
              height={394}
              className="w-full h-auto"
              unoptimized
              priority
            />
          </div>

          <h1 className="font-['Rokkitt',Georgia,'Times New Roman',serif] font-semibold text-white text-[38px] md:text-[56px] leading-[1] text-left max-w-[570px] pb-0 mb-[7px]">
            {headline.includes(highlightPhrase) ? (
              <>
                {headline.split(highlightPhrase)[0]}
                <span className="text-[#FDCC00] whitespace-nowrap">{highlightPhrase}</span>
                {headline.split(highlightPhrase)[1]}
              </>
            ) : (
              headline
            )}
          </h1>
          <p className="font-['Sora',Helvetica,Arial,sans-serif] text-[#cfd3ed] text-[18px] leading-[1.6] max-w-[510px] mb-[37px]">
            {t("hero.subtext")}
          </p>
          <AppButton as="a" href="#contacto">
            <span>{t("hero.cta")}</span>
            <span aria-hidden="true" className="ml-[0.3em]">➜</span>
          </AppButton>

        </div>

        {/* Image column */}
        <div className="flex-1 flex justify-center md:justify-end relative min-h-[340px] md:min-h-[600px] w-full">
          {/* Main banner image */}
          <div className="relative z-10 w-full max-w-sm md:max-w-md">
            <Image
              src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-2virtuos-banner-980x1472.png"
              alt="Virtuós Institute banner"
              width={490}
              height={736}
              className="w-full h-auto"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>

    </section>

    {/* Three feature cards — floating between hero and next section */}
    <div className="relative z-30 w-[90%] max-w-[1310px] mx-auto mt-[-100px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-[3%]">
        {featureCards.map((card) => (
          <div
            key={card.titleKey}
            className="bg-[#FA4361] rounded-[20px] overflow-hidden px-[10px]"
          >
            <div className="pt-[62px] pr-[35px] pb-[30px] pl-[35px] text-left font-['Sora',Helvetica,Arial,sans-serif] text-[15px] text-white leading-[1.6]">
              <div className="flex items-start gap-4">
                <Image
                  src={card.icon}
                  alt=""
                  width={56}
                  height={56}
                  className="w-14 h-14 shrink-0"
                  unoptimized
                />
                <div>
                  <h4 className="font-['Rokkitt',Georgia,'Times New Roman',serif] font-semibold text-[26px] leading-[1] text-white mb-3">
                    {t(card.titleKey)}
                  </h4>
                  <p className="text-white text-[15px] leading-[1.6]">
                    {t(card.bodyKey)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
