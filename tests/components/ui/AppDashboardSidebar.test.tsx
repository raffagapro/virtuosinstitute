import { render, screen } from "@testing-library/react";
import { AppDashboardSidebar } from "@/components/ui/AppDashboardSidebar";

const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/platfrom/dashboard/superadmin/users",
}));

describe("AppDashboardSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  it("renders sidebar items and highlights active route", () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

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

  it("renders pending authorization badge for users item", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        users: [
          { hasPendingAuthorization: true },
          { hasPendingAuthorization: false },
          { hasPendingAuthorization: true },
        ],
      }),
    });

    render(
      <AppDashboardSidebar
        ariaLabel="Pages"
        pendingUsersBadgeLabel="Pending users to authorize: {count}"
        items={[
          { href: "/platfrom/dashboard/superadmin", label: "Home" },
          {
            href: "/platfrom/dashboard/superadmin/users",
            label: "Users directory",
            showPendingAuthBadge: true,
          },
        ]}
      />
    );

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("Pending users to authorize: 2")).toHaveClass("sr-only");
  });
});
