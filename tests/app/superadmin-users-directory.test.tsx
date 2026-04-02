import { render, screen, waitFor } from "@testing-library/react";
import { SuperadminUsersDirectory } from "@/app/platfrom/dashboard/superadmin/users/SuperadminUsersDirectory";

const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}));

describe("SuperadminUsersDirectory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock | undefined) = jest.fn();
  });

  it("renders users returned by admin directory API", async () => {
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
          {
            id: "1",
            fullName: "Admin User",
            email: "admin@example.com",
            platformRole: "superadmin",
            preferredLocale: "es-MX",
            createdAt: "2026-04-02T00:00:00.000Z",
            membershipRoles: ["parent"],
          },
        ],
      }),
    });

    render(
      <SuperadminUsersDirectory
        title="Users directory"
        subtitle="All registered users"
        emptyLabel="No users"
        loadingLabel="Loading users..."
        errorLabel="Could not load"
        fullNameColumnLabel="Full name"
        emailColumnLabel="Email"
        platformRoleColumnLabel="Platform role"
        membershipRolesColumnLabel="Membership roles"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Admin User")).toBeInTheDocument();
    });

    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByText("superadmin")).toBeInTheDocument();
    expect(screen.getByText("parent")).toBeInTheDocument();
  });
});
