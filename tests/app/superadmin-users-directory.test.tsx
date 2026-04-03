import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SuperadminUsersDirectory } from "@/app/platfrom/dashboard/superadmin/users/SuperadminUsersDirectory";
import { SUPERADMIN_PENDING_USERS_REFRESH_EVENT } from "@/lib/dashboard-events";

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
    fireEvent.click(screen.getByRole("button", { name: "Teacher" }));
    expect(screen.getByText("Zoe Teacher")).toBeInTheDocument();
    expect(screen.queryByText("Ana Parent")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All roles" }));
    expect(screen.queryByRole("button", { name: "Superadmin" })).not.toBeInTheDocument();
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

  it("shows a loader while profile modal data is fetched", async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
        },
      },
    });

    let resolveProfileRequest: ((value: unknown) => void) | null = null;
    const profileRequest = new Promise((resolve) => {
      resolveProfileRequest = resolve;
    });

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          users: [
            {
              id: "u1",
              fullName: "Loading User",
              email: "loading@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["teacher"],
            },
          ],
        }),
      })
      .mockImplementationOnce(() => profileRequest as Promise<Response>);

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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Loading User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Loading User" }));

    expect(await screen.findByText("Loading users...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    resolveProfileRequest?.({
      ok: true,
      json: async () => ({
        ok: true,
        profile: {
          id: "u1",
          fullName: "Loading User",
          email: "loading@example.com",
          phone: "",
          dateOfBirth: null,
          preferredLocale: "es-MX",
          platformRole: null,
          isActive: true,
        },
        memberships: [
          {
            schoolRole: "teacher",
            approvalStatus: "approved",
            isActive: true,
          },
        ],
      }),
    });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
    });
  });

  it("creates and confirms a parent-child transfer request from profile modal", async () => {
    jest.useFakeTimers();

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
              id: "p1",
              fullName: "Parent User",
              email: "parent@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["parent"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          profile: {
            id: "p1",
            fullName: "Parent User",
            email: "parent@example.com",
            phone: "5551234567",
            dateOfBirth: "1988-05-10",
            preferredLocale: "es-MX",
            platformRole: null,
            isActive: true,
          },
          memberships: [
            {
              schoolRole: "parent",
              approvalStatus: "approved",
              isActive: true,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          linkedStudents: [
            {
              id: "s1",
              fullName: "Child One",
              gradeLevel: "primaria-2",
              approvalStatus: "approved",
              guardianLinkStatus: "approved",
            },
          ],
          candidateParents: [
            {
              id: "p2",
              fullName: "Target Parent",
              email: "target@example.com",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          transferRequestId: "tr_1",
          status: "pending_confirmation",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          status: "confirmed",
          transferredStudentCount: 1,
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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Parent User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Parent User" }));

    expect(await screen.findByText("Transfer children to another parent")).toBeInTheDocument();

    const studentCheckbox = screen.getByRole("checkbox", { name: "Child One (primaria-2)" });
    expect(studentCheckbox).not.toBeChecked();
    fireEvent.click(studentCheckbox);

    fireEvent.change(screen.getByRole("searchbox", { name: "Target parent" }), {
      target: { value: "target@example.com" },
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    fireEvent.click(screen.getByRole("button", { name: "Transfer selected children" }));

    expect(await screen.findByText("Transfer request created. Confirm to execute.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "Type TRANSFER to confirm" }), {
      target: { value: "TRANSFER" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm transfer" }));

    expect(await screen.findByText("Children were transferred successfully.")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("shows school owner in profile modal even when owner role is not assignable", async () => {
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
              id: "o1",
              fullName: "Owner User",
              email: "owner@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["school_owner"],
            },
          ],
          assignableRoles: ["direction", "coordination", "teacher", "clerk", "parent", "student", "guest"],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          profile: {
            id: "o1",
            fullName: "Owner User",
            email: "owner@example.com",
            phone: "",
            dateOfBirth: null,
            preferredLocale: "es-MX",
            platformRole: null,
            isActive: true,
          },
          memberships: [
            {
              schoolRole: "school_owner",
              approvalStatus: "approved",
              isActive: true,
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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        membershipRoleEditLabel="Membership role"
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Owner User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Owner User" }));

    expect(await screen.findByText("Membership role")).toBeInTheDocument();
    expect(screen.getAllByText("School owner").length).toBeGreaterThan(0);
  });

  it("refreshes users table when pending users refresh event is emitted", async () => {
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
              id: "1",
              fullName: "Existing User",
              email: "existing@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-02T00:00:00.000Z",
              membershipRoles: ["teacher"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          users: [
            {
              id: "1",
              fullName: "Existing User",
              email: "existing@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-02T00:00:00.000Z",
              membershipRoles: ["teacher"],
            },
            {
              id: "2",
              fullName: "New Pending User",
              email: "pending@example.com",
              platformRole: null,
              isActive: false,
              hasPendingAuthorization: true,
              preferredLocale: "es-MX",
              createdAt: "2026-04-03T00:00:00.000Z",
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

    expect(await screen.findByText("Existing User")).toBeInTheDocument();
    expect(screen.queryByText("New Pending User")).not.toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, {
          detail: { source: "external" },
        })
      );
    });

    expect(await screen.findByText("New Pending User")).toBeInTheDocument();
  });

  it("shows explicit message when searching for the same source parent account", async () => {
    jest.useFakeTimers();

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
              id: "p1",
              fullName: "Ringo Star",
              email: "ringo@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["parent"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          profile: {
            id: "p1",
            fullName: "Ringo Star",
            email: "ringo@example.com",
            phone: "5551234567",
            dateOfBirth: "1988-05-10",
            preferredLocale: "es-MX",
            platformRole: null,
            isActive: true,
          },
          memberships: [
            {
              schoolRole: "parent",
              approvalStatus: "approved",
              isActive: true,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          linkedStudents: [
            {
              id: "s1",
              fullName: "Child One",
              gradeLevel: "primaria-2",
              approvalStatus: "approved",
              guardianLinkStatus: "approved",
            },
          ],
          candidateParents: [
            {
              id: "p2",
              fullName: "Target Parent",
              email: "target@example.com",
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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        profileModalTransferTargetParentSameAccountLabel="You cannot transfer children to the same parent account."
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Ringo Star")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ringo Star" }));
    expect(await screen.findByText("Transfer children to another parent")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("searchbox", { name: "Target parent" }), {
      target: { value: "ringo" },
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(screen.getByText("You cannot transfer children to the same parent account.")).toBeInTheDocument();

    jest.useRealTimers();
  });

  it("renders owner profile as read-only for coordination actor", async () => {
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
          actorScope: "coordination",
          assignableRoles: ["teacher", "clerk", "parent", "student", "guest"],
          users: [
            {
              id: "o1",
              fullName: "Owner User",
              email: "owner@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["school_owner"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          profile: {
            id: "o1",
            fullName: "Owner User",
            email: "owner@example.com",
            phone: "5551234567",
            dateOfBirth: null,
            preferredLocale: "es-MX",
            platformRole: null,
            isActive: true,
          },
          memberships: [
            {
              schoolRole: "school_owner",
              approvalStatus: "approved",
              isActive: true,
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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        membershipRoleEditLabel="Membership role"
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Owner User")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Owner User" }));

    expect(await screen.findByDisplayValue("Owner User")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Membership role" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("does not render transfer module when parent has no linked students", async () => {
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
              id: "p1",
              fullName: "Parent Without Children",
              email: "parent-without-children@example.com",
              platformRole: null,
              isActive: true,
              hasPendingAuthorization: false,
              preferredLocale: "es-MX",
              createdAt: "2026-04-01T00:00:00.000Z",
              membershipRoles: ["parent"],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          profile: {
            id: "p1",
            fullName: "Parent Without Children",
            email: "parent-without-children@example.com",
            phone: "5551234567",
            dateOfBirth: "1988-05-10",
            preferredLocale: "es-MX",
            platformRole: null,
            isActive: true,
          },
          memberships: [
            {
              schoolRole: "parent",
              approvalStatus: "approved",
              isActive: true,
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          linkedStudents: [],
          candidateParents: [
            {
              id: "p2",
              fullName: "Target Parent",
              email: "target@example.com",
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
        profileModalTitle="Edit user profile"
        profileModalFullName="Full name"
        profileModalEmail="Email"
        profileModalPhone="Phone"
        profileModalDateOfBirth="Date of birth"
        profileModalLanguage="Language"
        profileModalTransferSectionTitle="Transfer children to another parent"
        profileModalCancel="Cancel"
        profileModalSave="Save"
        profileModalSaving="Saving"
        profileModalDeactivate="Deactivate"
        profileModalDeactivateConfirm="Confirm deactivate"
        profileModalDeactivateButton="Deactivate"
        profileModalError="Could not save"
      />
    );

    expect(await screen.findByText("Parent Without Children")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Parent Without Children" }));

    await waitFor(() => {
      expect(screen.queryByText("Transfer children to another parent")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("No linked children found for this parent.")).toBeInTheDocument();
    });
  });
});
