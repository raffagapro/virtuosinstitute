"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { useLocalization } from "@/lib/i18n/LocaleProvider";

const navLinks = [
  { key: "nav.nosotros" as const, anchor: "#sobre-nosotros" },
  { key: "nav.beneficios" as const, anchor: "#beneficios" },
  { key: "nav.oferta" as const, anchor: "#oferta-educativa" },
  { key: "nav.testimonios" as const, anchor: "#testimonios" },
];

const linkBase =
  "font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[14px] uppercase tracking-[1px] text-white hover:text-[#FDCC00] transition-colors whitespace-nowrap leading-[1]";

export function AppNavbar() {
  const { t } = useLocalization();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navBg = scrolled ? "#002b50" : "transparent";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300" style={{ backgroundColor: navBg, boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.1)" : "none" }}>
      <div className="w-full px-8 flex items-center justify-between h-[70px]">
        {/* Logo */}
        <a href="#inicio" aria-label={t("nav.logoAria")} className="shrink-0">
          <Image
            src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-6virtuos-logo-980x380.png"
            alt={t("nav.logoAria")}
            width={100}
            height={38}
            priority
            unoptimized
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0 translate-y-[8px]">
          {/* Inicio — always active (home page), yellow */}
          <a
            href="#inicio"
            className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[14px] uppercase tracking-[1px] text-[#fa4361] hover:text-[#e43756] transition-colors leading-[1] pr-[22px]"
          >
            {t("nav.inicio")}
          </a>
          {navLinks.map(({ key, anchor }) => (
            <a
              key={anchor}
              href={anchor}
              className={`${linkBase} pr-[22px]`}
            >
              {t(key)}
            </a>
          ))}
          <a
            href="/platfrom"
            className="inline-flex items-center font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white hover:text-white transition-colors leading-[1] px-[13px] py-[11px] rounded-[23px] bg-[#36e7e1] hover:bg-[#FDCC00] ml-1"
          >
            {t("nav.plataforma")}
          </a>
          {/* CTA pill */}
          <a
            href="#contacto"
            className="inline-flex items-center font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white hover:text-white transition-colors leading-[1] px-[13px] py-[11px] rounded-[23px] bg-[#fa4361] hover:bg-[#FDCC00] ml-1"
          >
            {t("nav.contacto")}
          </a>
        </nav>

        {/* Hamburger */}
        <button
          className="md:hidden p-2 text-[#003F60]"
          aria-label={t("nav.menuAria")}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="block w-6 h-0.5 bg-current mb-1" />
          <span className="block w-6 h-0.5 bg-current mb-1" />
          <span className="block w-6 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 border-t border-[#001f3a]",
          open ? "max-h-72" : "max-h-0"
        )}
        style={{ backgroundColor: "#002b50" }}
      >
        <nav className="flex flex-col px-6 py-4 gap-4">
          <a
            href="#inicio"
            className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[14px] uppercase tracking-[1px] text-[#fa4361] hover:text-[#e43756] transition-colors"
            onClick={() => setOpen(false)}
          >
            {t("nav.inicio")}
          </a>
          {navLinks.map(({ key, anchor }) => (
            <a
              key={anchor}
              href={anchor}
              className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[14px] uppercase tracking-[1px] text-white hover:text-[#FDCC00] transition-colors"
              onClick={() => setOpen(false)}
            >
              {t(key)}
            </a>
          ))}
          <a
            href="/platfrom"
            className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white hover:text-white transition-colors px-[13px] py-[11px] rounded-[23px] bg-[#36e7e1] hover:bg-[#FDCC00] self-start"
          >
            {t("nav.plataforma")}
          </a>
          {/* CTA pill */}
          <a
            href="#contacto"
            className="font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white hover:text-white transition-colors px-[13px] py-[11px] rounded-[23px] bg-[#fa4361] hover:bg-[#FDCC00] self-start"
            onClick={() => setOpen(false)}
          >
            {t("nav.contacto")}
          </a>
        </nav>
      </div>
    </header>
  );
}
