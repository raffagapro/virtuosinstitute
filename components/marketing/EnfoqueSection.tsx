import Image from "next/image";
import { translate, type Locale } from "@/lib/i18n";

const BASE = "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/";

const pillars = [
  {
    num: "1",
    titleKey: "enfoque.2.title",
    descKey: "enfoque.2.desc",
    icon: `${BASE}Mesa-de-trabajo-2virtuos-bg5.png`,
    anchor: "formacion-artistica",
    showTopDivider: true,
  },
  {
    num: "2",
    titleKey: "enfoque.3.title",
    descKey: "enfoque.3.desc",
    icon: `${BASE}Mesa-de-trabajo-2_2virtuos-bg5.png`,
    anchor: "formacion-socioemocional",
    showTopDivider: true,
  },
  {
    num: "3",
    titleKey: "enfoque.1.title",
    descKey: "enfoque.1.desc",
    icon: `${BASE}Mesa-de-trabajo-2_1virtuos-bg5.png`,
    anchor: "formacion-academica",
    showTopDivider: false,
  },
] as const;

interface EnfoqueSectionProps {
  locale?: Locale;
}

export function EnfoqueSection({ locale = "es-MX" }: EnfoqueSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <section
      className="bg-[#f7f9fb] py-20 md:py-24"
      id="formacion-artistica"
    >
      <div className="mx-auto flex w-[90%] max-w-[1290px] flex-col gap-12 py-0">
        <div className="flex flex-col items-center text-center gap-3">
          <p className="font-['Sora',Helvetica,Arial,sans-serif] font-bold uppercase text-[16px] text-[#FA4361] text-center tracking-[0.2em]">
            {t("enfoque.sectionLabel")}
          </p>
          <div style={{ display: "inline-block" }}>
            <h2 className="font-['Sora',Helvetica,Arial,sans-serif] font-bold text-[#00197e] text-[43px] leading-[1.25em] text-center whitespace-nowrap">
              {t("enfoque.heading")}
            </h2>
            <p className="font-['Sora',Helvetica,Arial,sans-serif] text-[17px] text-[#3a4268] leading-[1.6em] text-center mt-3 max-w-xl mx-auto">
              {t("enfoque.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start md:grid-cols-3 md:gap-6">
          {pillars.map(({ num, titleKey, descKey, icon, anchor, showTopDivider }) => (
            <div
              key={num}
              id={anchor}
              className="relative flex w-full flex-col items-stretch overflow-visible text-center"
            >
              <div className="relative z-10 m-0 inline-flex h-[110px] w-[110px] self-center items-center justify-center rounded-[20px] bg-[#002B50] px-[5px] py-[8px] text-center leading-[145px]">
                <Image
                  src={icon}
                  alt=""
                  width={201}
                  height={201}
                  className="relative z-20 h-full w-full object-contain"
                  unoptimized
                />
                <p className="absolute left-1/2 top-[41px] z-30 inline-flex h-[26px] w-[26px] -translate-x-[-42px] items-center justify-center rounded-full bg-[#ffc703] font-['Sora',Helvetica,Arial,sans-serif] text-[14px] font-bold leading-[1em] text-[#00197e]">
                  {num}
                </p>
                {showTopDivider ? (
                  <Image
                    src={`${BASE}cleaner-9-gtr-7.png`}
                    alt=""
                    width={306}
                    height={32}
                    className="pointer-events-none absolute right-[-310px] top-[43%] z-[-1] h-auto w-[306px] max-w-[306px] -translate-y-1/2"
                    unoptimized
                  />
                ) : null}
              </div>

              <h3 className="mt-3 min-h-[74px] w-full text-left font-['Sora',Helvetica,Arial,sans-serif] text-[31px] font-bold leading-[1.2em] text-[#00197e]">
                {t(titleKey)}
              </h3>

              <div className="my-4 h-px w-full bg-[#d9deea]" />

              <p className="min-h-[136px] w-full text-center font-['Sora',Helvetica,Arial,sans-serif] text-[17px] leading-[1.6em] text-[#3a4268]">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
