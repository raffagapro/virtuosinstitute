/** @jest-environment node */

import { GET } from "@/app/api/admin/users-directory/route";

const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
  getSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

describe("GET /api/admin/users-directory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function profilesActorQuery(actorPlatformRole: string | null) {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { platform_role: actorPlatformRole },
            error: null,
          }),
        }),
      }),
    };
  }

  function actorMembershipQuery(actorMembershipRoles: string[]) {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            eq: async () => ({
              data: actorMembershipRoles.map((schoolRole) => ({ school_role: schoolRole })),
              error: null,
            }),
          }),
        }),
      }),
    };
  }

  function profilesListQuery(profileRows: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    platform_role: string | null;
    preferred_locale: string;
    created_at: string;
  }>) {
    return {
      select: () => ({
        order: async () => ({
          data: profileRows,
          error: null,
        }),
      }),
    };
  }

  function membershipListQuery(membershipRows: Array<{
    profile_id: string;
    school_role: string;
    is_active: boolean;
    approval_status: string;
    created_at: string;
    updated_at: string;
  }>) {
    return {
      select: async () => ({
        data: membershipRows,
        error: null,
      }),
    };
  }

  it("returns all non-superadmin users for superadmin actor", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null });

    const profileRows = [
      {
        id: "u-owner",
        full_name: "Owner",
        email: "owner@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-superadmin",
        full_name: "Super",
        email: "super@example.com",
        platform_role: "superadmin",
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-teacher",
        full_name: "Teacher",
        email: "teacher@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    const membershipRows = [
      {
        profile_id: "u-owner",
        school_role: "school_owner",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      {
        profile_id: "u-teacher",
        school_role: "teacher",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    mockFrom
      .mockReturnValueOnce(profilesActorQuery("superadmin"))
      .mockReturnValueOnce(profilesListQuery(profileRows))
      .mockReturnValueOnce(membershipListQuery(membershipRows));

    const response = await GET(
      new Request("http://localhost/api/admin/users-directory", {
        method: "GET",
        headers: { Authorization: "Bearer token" },
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.actorScope).toBe("superadmin");
    expect(payload.users.map((user: { id: string }) => user.id)).toEqual(["u-owner", "u-teacher"]);
  });

  it("filters out owner-level targets for school owner actor", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null });

    const profileRows = [
      {
        id: "u-owner",
        full_name: "Owner",
        email: "owner@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-direction",
        full_name: "Direction",
        email: "direction@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-teacher",
        full_name: "Teacher",
        email: "teacher@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    const membershipRows = [
      {
        profile_id: "u-owner",
        school_role: "school_owner",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      {
        profile_id: "u-direction",
        school_role: "direction",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      {
        profile_id: "u-teacher",
        school_role: "teacher",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    mockFrom
      .mockReturnValueOnce(profilesActorQuery(null))
      .mockReturnValueOnce(actorMembershipQuery(["school_owner"]))
      .mockReturnValueOnce(profilesListQuery(profileRows))
      .mockReturnValueOnce(membershipListQuery(membershipRows));

    const response = await GET(
      new Request("http://localhost/api/admin/users-directory", {
        method: "GET",
        headers: { Authorization: "Bearer token" },
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.actorScope).toBe("school_owner");
    expect(payload.users.map((user: { id: string }) => user.id)).toEqual(["u-direction", "u-teacher"]);
    expect(payload.users.some((user: { id: string }) => user.id === "u-owner")).toBe(false);
  });

  it("filters out coordination-level targets for coordination actor", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null });

    const profileRows = [
      {
        id: "u-direction",
        full_name: "Direction",
        email: "direction@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-coordination",
        full_name: "Coordination",
        email: "coordination@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
      {
        id: "u-teacher",
        full_name: "Teacher",
        email: "teacher@example.com",
        platform_role: null,
        preferred_locale: "es-MX",
        created_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    const membershipRows = [
      {
        profile_id: "u-direction",
        school_role: "direction",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      {
        profile_id: "u-coordination",
        school_role: "coordination",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
      {
        profile_id: "u-teacher",
        school_role: "teacher",
        is_active: true,
        approval_status: "approved",
        created_at: "2026-04-01T00:00:00.000Z",
        updated_at: "2026-04-01T00:00:00.000Z",
      },
    ];

    mockFrom
      .mockReturnValueOnce(profilesActorQuery(null))
      .mockReturnValueOnce(actorMembershipQuery(["coordination"]))
      .mockReturnValueOnce(profilesListQuery(profileRows))
      .mockReturnValueOnce(membershipListQuery(membershipRows));

    const response = await GET(
      new Request("http://localhost/api/admin/users-directory", {
        method: "GET",
        headers: { Authorization: "Bearer token" },
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.actorScope).toBe("coordination");
    expect(payload.users.map((user: { id: string }) => user.id)).toEqual(["u-teacher"]);
  });
});
