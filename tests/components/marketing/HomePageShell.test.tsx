import { fireEvent, render, screen } from "@testing-library/react";
import { HomePageShell } from "@/components/marketing/HomePageShell";

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

describe("HomePageShell", () => {
  it("switches the static site copy between Spanish and English from the footer", () => {
    render(<HomePageShell initialLocale="es-MX" />);

    expect(screen.getAllByRole("link", { name: "Inicio" }).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Cambiar idioma a inglés" }));

    expect(screen.getAllByRole("link", { name: "Home" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Contact Us" }).length).toBeGreaterThan(0);
  });
});