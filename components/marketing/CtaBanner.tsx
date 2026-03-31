import Image from "next/image";
import { translate, type Locale } from "@/lib/i18n";

interface CtaBannerProps {
  locale?: Locale;
}

const BASE = "https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/";
const BASE_2025_02 = "https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/";

export function CtaBanner({ locale = "es-MX" }: CtaBannerProps) {
  return (
    <section
      className="relative overflow-visible bg-[#003F60] py-0"
      style={{
        backgroundImage: `url(${BASE}Recurso-2virtuos-2banner.png)`,
        backgroundPosition: "left -100% top",
        backgroundRepeat: "no-repeat",
        backgroundSize: "initial",
      }}
    >
      <div className="mx-auto w-[90%] max-w-[1290px] pb-0 pt-1">
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-10">
          <div>
            <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-left text-[30px] font-bold leading-[1.2em] text-white md:text-[42px]">
              {translate(locale, "ctaBanner.text")}
            </h2>
          </div>
          <div className="-mt-10 flex justify-center md:-mt-16 md:justify-end">
            <Image
              src={`${BASE_2025_02}Mesa-de-trabajo-6.png`}
              alt=""
              width={800}
              height={282}
              className="h-auto w-full max-w-[800px]"
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
