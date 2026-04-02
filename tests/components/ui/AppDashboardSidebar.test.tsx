import { render, screen } from "@testing-library/react";
import { AppDashboardSidebar } from "@/components/ui/AppDashboardSidebar";

jest.mock("next/navigation", () => ({
  usePathname: () => "/platfrom/dashboard/superadmin/users",
}));

describe("AppDashboardSidebar", () => {
  it("renders sidebar items and highlights active route", () => {
    render(
      <AppDashboardSidebar
        ariaLabel="Pages"
        items={[
          { href: "/platfrom/dashboard/superadmin", label: "Home" },
          { href: "/platfrom/dashboard/superadmin/users", label: "Users directory" },
          { href: "/platfrom/dashboard/superadmin/settings", label: "Settings" },
        ]}
      />
    );

    const active = screen.getByRole("link", { name: "Users directory" });
    expect(active.className).toContain("bg-[#003F60]");
    const home = screen.getByRole("link", { name: "Home" });
    expect(home.className).not.toContain("bg-[#003F60]");
    const inactive = screen.getByRole("link", { name: "Settings" });
    expect(inactive.className).not.toContain("bg-[#003F60]");
  });
});
