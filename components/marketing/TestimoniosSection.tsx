"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AppSectionHeading } from "@/components/ui";
import { translate, type Locale } from "@/lib/i18n";

interface TestimoniosSectionProps {
  locale?: Locale;
}

const testimonialSlides = [
  { quoteKey: "testimonios.1.quote", authorKey: "testimonios.1.author" },
  { quoteKey: "testimonios.2.quote", authorKey: "testimonios.2.author" },
  { quoteKey: "testimonios.3.quote", authorKey: "testimonios.3.author" },
  { quoteKey: "testimonios.4.quote", authorKey: "testimonios.4.author" },
] as const;

export function TestimoniosSection({ locale = "es-MX" }: TestimoniosSectionProps) {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key);
  const [activeSlide, setActiveSlide] = useState(0);

  const goToPrevSlide = () => {
    setActiveSlide((current) =>
      current === 0 ? testimonialSlides.length - 1 : current - 1
    );
  };

  const goToNextSlide = () => {
    setActiveSlide((current) => (current + 1) % testimonialSlides.length);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      goToNextSlide();
    }, 9000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <section
      id="testimonios"
      className="py-20"
      style={{
        backgroundColor: "rgb(0, 43, 80)",
        backgroundImage:
          "url(https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Mesa-de-trabajo-5virtuos-bg3.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-12">
        <AppSectionHeading
          label={t("testimonios.sectionLabel")}
          title={t("testimonios.heading")}
          titleClassName="text-white"
        />

        {/* Testimonial carousel */}
        <div className="mx-auto w-full max-w-4xl">
          <div className="relative min-h-[391px]">
            {testimonialSlides.map((slide, index) => (
              <div
                key={`slide-${index}`}
                className={[
                  "absolute inset-0 flex flex-col items-center justify-center gap-4 text-center transition-opacity duration-500",
                  index === activeSlide ? "opacity-100" : "pointer-events-none opacity-0",
                ].join(" ")}
              >
                <Image
                  src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/02/Estrellas-300x50.png"
                  alt=""
                  width={180}
                  height={50}
                  className="h-auto w-[180px]"
                  unoptimized
                />

                <p className="font-['Sora',Helvetica,Arial,sans-serif] text-[16px] leading-[1.7] text-white">
                  &ldquo;{t(slide.quoteKey)}&rdquo;
                </p>

                <p className="font-['Sora',Helvetica,Arial,sans-serif] text-[16px] italic text-[#37e8e2]">
                  — {t(slide.authorKey)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              type="button"
              aria-label="Previous testimonial"
              onClick={goToPrevSlide}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-2">
              {testimonialSlides.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  aria-label={`Go to testimonial ${index + 1}`}
                  onClick={() => setActiveSlide(index)}
                  className={[
                    "h-2.5 w-2.5 rounded-full transition-colors",
                    index === activeSlide ? "bg-[#37e8e2]" : "bg-white/45",
                  ].join(" ")}
                />
              ))}
            </div>

            <button
              type="button"
              aria-label="Next testimonial"
              onClick={goToNextSlide}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:text-white"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
