import { render, screen } from "@testing-library/react";
import PlatformLandingPage from "@/app/platfrom/page";

describe("PlatformLandingPage", () => {
  it("renders localized title and approval-gate checking state", () => {
    render(<PlatformLandingPage />);

    expect(screen.getByRole("heading", { name: "Accede a la plataforma Virtuós" })).toBeInTheDocument();
    expect(screen.getByText("Validando tu acceso a la plataforma...")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });
});
