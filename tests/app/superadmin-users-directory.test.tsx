import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
            fullName: "Parent User",
            email: "parent@example.com",
            platformRole: null,
            isActive: true,
            hasPendingAuthorization: false,
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
        searchPlaceholder="Search by name or email"
        emptyLabel="No users"
        loadingLabel="Loading users..."
        errorLabel="Could not load"
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        statusPendingAuthorizationLabel="Pending authorization"
        roleFilterLabel="Role"
        roleAllLabel="All roles"
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
        statusColumnLabel="Status"
        fullNameColumnLabel="Full name"
        emailColumnLabel="Email"
        platformRoleColumnLabel="Platform role"
        membershipRolesColumnLabel="Membership roles"
        pendingStatusLabel="Pending"
        authorizeModalTitle="Authorize user"
        authorizeModalUserLabel="User"
        authorizeModalEmailLabel="Email"
        authorizeModalRoleLabel="Assign role"
        authorizeModalCancelLabel="Cancel"
        authorizeModalConfirmLabel="Authorize"
        authorizeModalSubmittingLabel="Authorizing..."
        authorizeModalErrorLabel="Could not authorize user"
        roleOptionSchoolOwnerLabel="School owner"
        roleOptionDirectionLabel="Direction"
        roleOptionCoordinationLabel="Coordination"
        roleOptionTeacherLabel="Teacher"
        roleOptionClerkLabel="Clerk"
        roleOptionParentLabel="Parent"
        roleOptionStudentLabel="Student"
        roleOptionGuestLabel="Guest"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Parent User")).toBeInTheDocument();
    });

    expect(screen.getByText("parent@example.com")).toBeInTheDocument();
    expect(screen.queryByText("superadmin")).not.toBeInTheDocument();
    expect(screen.getAllByText("parent").length).toBeGreaterThan(0);
    // Verify Active status is displayed
    const activeCells = screen.getAllByText("Active");
    expect(activeCells.length).toBeGreaterThan(0);
  });

  it("filters by search, status, role and order controls", async () => {
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
            fullName: "Zoe Teacher",
            email: "zoe@example.com",
            platformRole: null,
            isActive: true,
            hasPendingAuthorization: false,
            preferredLocale: "es-MX",
            createdAt: "2026-04-03T00:00:00.000Z",
            membershipRoles: ["teacher"],
          },
          {
            id: "2",
            fullName: "Ana Parent",
            email: "ana@example.com",
            platformRole: null,
            isActive: false,
            hasPendingAuthorization: true,
            preferredLocale: "es-MX",
            createdAt: "2026-04-01T00:00:00.000Z",
            membershipRoles: ["parent"],
          },
          {
            id: "3",
            fullName: "Carlos Super",
            email: "carlos@example.com",
            platformRole: "superadmin",
            isActive: true,
            hasPendingAuthorization: false,
            preferredLocale: "es-MX",
            createdAt: "2026-04-02T00:00:00.000Z",
            membershipRoles: [],
          },
          {
            id: "4",
            fullName: "Bruno Clerk",
            email: "bruno@example.com",
            platformRole: null,
            isActive: false,
            hasPendingAuthorization: false,
            preferredLocale: "es-MX",
            createdAt: "2026-03-31T00:00:00.000Z",
            membershipRoles: ["clerk"],
          },
        ],
      }),
    });

    render(
      <SuperadminUsersDirectory
        title="Users directory"
        subtitle="All registered users"
        searchPlaceholder="Search by name or email"
        emptyLabel="No users"
        loadingLabel="Loading users..."
        errorLabel="Could not load"
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        statusPendingAuthorizationLabel="Pending authorization"
        roleFilterLabel="Role"
        roleAllLabel="All roles"
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
        statusColumnLabel="Status"
        fullNameColumnLabel="Full name"
        emailColumnLabel="Email"
        platformRoleColumnLabel="Platform role"
        membershipRolesColumnLabel="Membership roles"
        pendingStatusLabel="Pending"
        authorizeModalTitle="Authorize user"
        authorizeModalUserLabel="User"
        authorizeModalEmailLabel="Email"
        authorizeModalRoleLabel="Assign role"
        authorizeModalCancelLabel="Cancel"
        authorizeModalConfirmLabel="Authorize"
        authorizeModalSubmittingLabel="Authorizing..."
        authorizeModalErrorLabel="Could not authorize user"
        roleOptionSchoolOwnerLabel="School owner"
        roleOptionDirectionLabel="Direction"
        roleOptionCoordinationLabel="Coordination"
        roleOptionTeacherLabel="Teacher"
        roleOptionClerkLabel="Clerk"
        roleOptionParentLabel="Parent"
        roleOptionStudentLabel="Student"
        roleOptionGuestLabel="Guest"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Zoe Teacher")).toBeInTheDocument();
    });

    const initialNames = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent ?? "");
    expect(initialNames[0]).toBe("Ana Parent");
    // Verify Pending status is displayed
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Bruno Clerk")).toBeInTheDocument();
    // Verify Inactive status is displayed
    const inactiveCells = screen.getAllByText("Inactive");
    expect(inactiveCells.length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search by name or email" }), {
      target: { value: "ana" },
    });
    expect(screen.getByText("Ana Parent")).toBeInTheDocument();
    expect(screen.queryByText("Zoe Teacher")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Search by name or email" }), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Inactive" }));
    expect(screen.getByText("Ana Parent")).toBeInTheDocument();
    expect(screen.getByText("Bruno Clerk")).toBeInTheDocument();
    expect(screen.queryByText("Zoe Teacher")).not.toBeInTheDocument();
    // Verify Pending and Inactive statuses are shown
    expect(screen.getByText("Pending")).toBeInTheDocument();
    const inactiveStatusCells = screen.getAllByText("Inactive");
    expect(inactiveStatusCells.length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "All" }));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "teacher" } });
    expect(screen.getByText("Zoe Teacher")).toBeInTheDocument();
    expect(screen.queryByText("Ana Parent")).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "all" } });
    expect(screen.queryByRole("option", { name: "superadmin" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Name A-Z" }));
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector("td")?.textContent ?? "");
    // Verify correct order: Ana Parent (pending), Bruno Clerk (inactive), Carlos Super (active), Zoe Teacher (active)
    expect(names[0]).toContain("Ana Parent");
  });

  it("opens authorization modal from pending status and authorizes user", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          users: [
            {
              id: "2",
              fullName: "Ana Parent",
              email: "ana@example.com",
              platformRole: null,
              isActive: false,
              hasPendingAuthorization: true,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["parent"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, status: "approved" }),
      });

    render(
      <SuperadminUsersDirectory
        title="Users directory"
        subtitle="All registered users"
        searchPlaceholder="Search by name or email"
        emptyLabel="No users"
        loadingLabel="Loading users..."
        errorLabel="Could not load"
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        statusPendingAuthorizationLabel="Pending authorization"
        roleFilterLabel="Role"
        roleAllLabel="All roles"
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
        statusColumnLabel="Status"
        fullNameColumnLabel="Full name"
        emailColumnLabel="Email"
        platformRoleColumnLabel="Platform role"
        membershipRolesColumnLabel="Membership roles"
        pendingStatusLabel="Pending"
        authorizeModalTitle="Authorize user"
        authorizeModalUserLabel="User"
        authorizeModalEmailLabel="Email"
        authorizeModalRoleLabel="Assign role"
        authorizeModalCancelLabel="Cancel"
        authorizeModalConfirmLabel="Authorize"
        authorizeModalSubmittingLabel="Authorizing..."
        authorizeModalErrorLabel="Could not authorize user"
        roleOptionSchoolOwnerLabel="School owner"
        roleOptionDirectionLabel="Direction"
        roleOptionCoordinationLabel="Coordination"
        roleOptionTeacherLabel="Teacher"
        roleOptionClerkLabel="Clerk"
        roleOptionParentLabel="Parent"
        roleOptionStudentLabel="Student"
        roleOptionGuestLabel="Guest"
      />
    );

    expect(await screen.findByText("Ana Parent")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pending" }));

    expect(screen.getByText("Authorize user")).toBeInTheDocument();
    expect(screen.getAllByText("ana@example.com").length).toBeGreaterThan(0);

    fireEvent.change(screen.getByRole("combobox", { name: "Assign role" }), {
      target: { value: "teacher" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Authorize" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/parent-approvals",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    expect(screen.queryByText("Authorize user")).not.toBeInTheDocument();
  });
});
