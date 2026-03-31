import { render, screen } from "@testing-library/react";
import { AppNavbar } from "@/components/layout/AppNavbar";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    priority: _priority,
    unoptimized: _unoptimized,
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & {
    priority?: boolean;
    unoptimized?: boolean;
    fill?: boolean;
  }) => <img {...props} alt={props.alt ?? ""} />,
}));

function expectLinkTarget(name: string, href: string) {
  const links = screen.getAllByRole("link", { name });
  expect(links.some((link) => link.getAttribute("href") === href)).toBe(true);
}

describe("AppNavbar", () => {
  it("renders the expected Spanish nav links with correct anchors", () => {
    render(<AppNavbar />);

    expectLinkTarget("Inicio", "#inicio");
    expectLinkTarget("Sobre Nosotros", "#sobre-nosotros");
    expectLinkTarget("Beneficios y diferenciadores", "#beneficios");
    expectLinkTarget("Oferta educativa", "#oferta-educativa");
    expectLinkTarget("Testimonios", "#testimonios");

    const contactLinks = screen.getAllByRole("link", { name: "Contáctanos" });
    expect(contactLinks.some((link) => link.getAttribute("href") === "#contacto")).toBe(true);
  });

  it("keeps the contact action as a red CTA", () => {
    render(<AppNavbar />);

    const contactLinks = screen.getAllByRole("link", { name: "Contáctanos" });
    expect(contactLinks.some((link) => link.className.includes("bg-[#fa4361]"))).toBe(true);
  });
});
