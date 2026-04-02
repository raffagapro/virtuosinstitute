import { render, screen } from "@testing-library/react";
import SuperadminDashboardHomePage from "@/app/platfrom/dashboard/superadmin/page";

describe("SuperadminDashboardHomePage", () => {
  it("renders the dashboard home content instead of redirecting to users", () => {
    render(<SuperadminDashboardHomePage />);

    expect(screen.getByRole("heading", { name: "Dashboard de superadministrador" })).toBeInTheDocument();
    expect(screen.getByText("Directorio de usuarios")).toBeInTheDocument();
    expect(screen.getByText("Aprobaciones")).toBeInTheDocument();
    expect(screen.getByText("Configuracion de plataforma")).toBeInTheDocument();
  });
});
