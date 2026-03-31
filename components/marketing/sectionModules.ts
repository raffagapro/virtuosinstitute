import { type ComponentType } from "react";
import { type Locale } from "@/lib/i18n";
import { HeroSection } from "./HeroSection";
import { SobreNosotrosSection } from "./SobreNosotrosSection";
import { BeneficiosSection } from "./BeneficiosSection";
import { EnfoqueSection } from "./EnfoqueSection";
import { CtaBanner } from "./CtaBanner";
import { OfertaSection } from "./OfertaSection";
import { TestimoniosSection } from "./TestimoniosSection";
import { LeadFormSection } from "./LeadFormSection";

export const marketingSectionOrder = [
  "hero",
  "sobre-nosotros",
  "beneficios",
  "enfoque",
  "cta-banner",
  "oferta",
  "testimonios",
  "lead-form",
] as const;

export type MarketingSectionId = (typeof marketingSectionOrder)[number];

type MarketingSectionComponent = ComponentType<{ locale?: Locale }>;

const marketingSectionRegistry: Record<MarketingSectionId, MarketingSectionComponent> = {
  hero: HeroSection,
  "sobre-nosotros": SobreNosotrosSection,
  beneficios: BeneficiosSection,
  enfoque: EnfoqueSection,
  "cta-banner": CtaBanner,
  oferta: OfertaSection,
  testimonios: TestimoniosSection,
  "lead-form": LeadFormSection,
};

export function getMarketingSections(order: readonly MarketingSectionId[] = marketingSectionOrder) {
  return order.map((id) => ({ id, Component: marketingSectionRegistry[id] }));
}
