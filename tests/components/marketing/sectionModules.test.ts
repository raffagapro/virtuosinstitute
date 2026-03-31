import {
  getMarketingSections,
  marketingSectionOrder,
} from "@/components/marketing/sectionModules";

describe("marketing section modules", () => {
  it("exposes a stable default section order", () => {
    expect(marketingSectionOrder).toEqual([
      "hero",
      "sobre-nosotros",
      "beneficios",
      "enfoque",
      "cta-banner",
      "oferta",
      "testimonios",
      "lead-form",
    ]);
  });

  it("resolves section modules in requested order", () => {
    const selected = getMarketingSections(["hero", "lead-form"]);

    expect(selected).toHaveLength(2);
    expect(selected[0]?.id).toBe("hero");
    expect(selected[1]?.id).toBe("lead-form");
    expect(selected[0]?.Component).toBeDefined();
    expect(selected[1]?.Component).toBeDefined();
  });
});
