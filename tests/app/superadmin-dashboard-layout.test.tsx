import { render, screen } from "@testing-library/react";
import SuperadminDashboardLayout from "@/app/platfrom/dashboard/superadmin/layout";

jest.mock("@/app/platfrom/dashboard/PlatformDashboardGate", () => ({
  PlatformDashboardGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("SuperadminDashboardLayout", () => {
  it("renders shared footer with dashboard content", () => {
    render(
      <SuperadminDashboardLayout>
        <article>Dashboard content</article>
      </SuperadminDashboardLayout>
    );

    expect(screen.getByRole("button", { name: "Cerrar sesion" })).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
