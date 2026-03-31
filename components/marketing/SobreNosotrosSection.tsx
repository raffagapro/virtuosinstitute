import Image from "next/image";
import { translate, type Locale } from "@/lib/i18n";

const values = [
  "nosotros.valor.vida",
  "nosotros.valor.felicidad",
  "nosotros.valor.autoestima",
  "nosotros.valor.autonomia",
  "nosotros.valor.perseverancia",
  "nosotros.valor.responsabilidad",
  "nosotros.valor.honestidad",
  "nosotros.valor.respeto",
] as const;

interface SobreNosotrosSectionProps {
  locale?: Locale;
}

export function SobreNosotrosSection({ locale = "es-MX" }: SobreNosotrosSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);

  return (
    <section id="sobre-nosotros" className="relative z-10 bg-white pt-16 pb-20">
      <div className="w-[90%] max-w-[1310px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-0">
        {/* Left image */}
        <div className="w-full md:w-1/2 flex justify-start">
          <div className="w-full max-w-[80%] md:-ml-[26px]">
            <Image
              src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/Recurso-6virtuos-980x1240.png"
              alt="Virtuós Institute"
              width={1069}
              height={1353}
              className="w-full h-auto"
              unoptimized
            />
          </div>
        </div>

        {/* Right text */}
        <div className="w-full md:w-1/2 md:pl-3 flex flex-col gap-6">
          <h4 className="font-['Poppins',Helvetica,Arial,sans-serif] text-[16px] font-semibold uppercase tracking-[2px] text-[#FA4361] text-left leading-none">
            {t("nosotros.sectionLabel")}
          </h4>
          <h2 className="font-['Rokkitt',Georgia,'Times New Roman',serif] font-bold text-[#FDCC00] text-[38px] md:text-[50px] leading-[1.25] text-left md:whitespace-nowrap max-w-none">
            {t("nosotros.heading")}
          </h2>
          <p className="font-['Open_Sans',Arial,sans-serif] text-[#666] text-base leading-[1.7] max-w-xl">
            {t("nosotros.body")}
          </p>

          <div className="max-w-xl">
            <p className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[#003F60] text-base mb-4">
              {t("nosotros.valoresLabel")}
            </p>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              {values.map((key) => (
                <div key={key} className="flex items-start gap-2 text-[#003F60]">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#37E8E2] text-[12px] leading-none text-white">
                    ✓
                  </span>
                  <span className="font-['Sora',Helvetica,Arial,sans-serif] text-[15px] leading-[1.6]">
                    {t(key)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <a
            href="#contacto"
            className="self-start inline-flex items-center rounded-[30px] font-['Manrope',Helvetica,Arial,sans-serif] text-[16px] font-semibold text-[#002B50] bg-[#37E8E2] hover:bg-[#FDCC00] pl-[38px] pr-[50px] py-[11px] leading-[1.7] transition-colors duration-300"
          >
            <span>{t("nosotros.cta")}</span>
            <span aria-hidden="true" className="ml-[0.3em]">➜</span>
          </a>
        </div>
      </div>
    </section>
  );
}
