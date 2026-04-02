import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppDashboardNavbar } from "@/components/ui/AppDashboardNavbar";

const mockSignOut = jest.fn();
const mockGetSession = jest.fn();
const mockUsePathname = jest.fn();

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

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
      signOut: mockSignOut,
    },
  }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

describe("AppDashboardNavbar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/platfrom/dashboard/superadmin/users");
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  it("renders identity, role badge, profile action and signs out from top-right button", async () => {
    mockSignOut.mockResolvedValue(undefined);
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
        fullName: "Admin User",
        email: "admin@example.com",
        effectiveRole: "superadmin",
        highestRole: "superadmin",
        profilePath: "/platfrom/dashboard/superadmin/profile",
      }),
    });

    const onSignedOutRedirect = jest.fn();

    render(
      <AppDashboardNavbar
        logoAriaLabel="Virtuós Institute"
        profileLabel="Profile"
        signOutLabel="Sign out"
        signingOutLabel="Signing out..."
        loadingIdentityLabel="Loading account"
        roleSuperadminLabel="Superadmin"
        roleStaffLabel="Staff"
        roleParentLabel="Parent"
        onSignedOutRedirect={onSignedOutRedirect}
      />
    );

    expect(screen.getByRole("link", { name: "Virtuós Institute" })).toHaveAttribute("href", "/");
    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Profile" })).toHaveTextContent("Admin User");
    });
    const badge = screen.getByTestId("profile-role-badge");
    expect(badge).toBeInTheDocument();
    expect(badge.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/platfrom/dashboard/superadmin/profile");

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(onSignedOutRedirect).toHaveBeenCalledWith("/platfrom");
    });
  });

  it("shows role badge using pathname fallback when navbar context is not yet available", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

    render(
      <AppDashboardNavbar
        logoAriaLabel="Virtuós Institute"
        profileLabel="Profile"
        signOutLabel="Sign out"
        signingOutLabel="Signing out..."
        loadingIdentityLabel="Loading account"
        roleSuperadminLabel="Superadmin"
        roleStaffLabel="Staff"
        roleParentLabel="Parent"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("profile-role-badge")).toBeInTheDocument();
    });
    expect(screen.getByTestId("profile-role-badge").querySelector("svg")).not.toBeNull();
  });
});
