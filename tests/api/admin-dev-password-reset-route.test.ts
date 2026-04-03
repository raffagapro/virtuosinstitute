/** @jest-environment node */

import { POST } from "@/app/api/admin/dev-password-reset/route";

const mockIsEmailAuthEnabled = jest.fn();
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockUpdateUserById = jest.fn();

jest.mock("@/lib/auth-flags", () => ({
  isEmailAuthEnabled: () => mockIsEmailAuthEnabled(),
}));

jest.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
  getSupabaseAdminClient: () => ({
    from: mockFrom,
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  }),
}));

describe("POST /api/admin/dev-password-reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEmailAuthEnabled.mockReturnValue(true);
  });

  function mockProfilesTableResponses(input: {
    actorPlatformRole?: string | null;
    targetProfileId?: string | null;
    actorProfileError?: unknown;
    targetProfileError?: unknown;
  }) {
    mockFrom.mockImplementation((tableName: string) => {
      if (tableName !== "profiles") {
        throw new Error("Unexpected table");
      }

      return {
        select: () => ({
          eq: (columnName: string, value: string) => ({
            maybeSingle: async () => {
              if (columnName === "id") {
                return {
                  data: { platform_role: input.actorPlatformRole ?? "superadmin" },
                  error: input.actorProfileError ?? null,
                };
              }

              if (columnName === "email") {
                return {
                  data: input.targetProfileId ? { id: input.targetProfileId } : null,
                  error: input.targetProfileError ?? null,
                };
              }

              throw new Error(`Unexpected column: ${columnName}=${value}`);
            },
          }),
        }),
      };
    });
  }

  it("resets password for an existing email user when actor is superadmin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "actor-1" } },
      error: null,
    });
    mockProfilesTableResponses({ actorPlatformRole: "superadmin", targetProfileId: "target-1" });
    mockUpdateUserById.mockResolvedValue({ data: { user: { id: "target-1" } }, error: null });

    const response = await POST(
      new Request("http://localhost/api/admin/dev-password-reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "qa.user@example.com", password: "password123" }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ ok: true, email: "qa.user@example.com" });
    expect(mockUpdateUserById).toHaveBeenCalledWith("target-1", { password: "password123" });
  });

  it("returns forbidden when actor is not superadmin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "actor-1" } },
      error: null,
    });
    mockProfilesTableResponses({ actorPlatformRole: "coordination", targetProfileId: "target-1" });

    const response = await POST(
      new Request("http://localhost/api/admin/dev-password-reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "qa.user@example.com", password: "password123" }),
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ ok: false, reason: "forbidden" });
  });

  it("returns email-not-found when profile does not exist for provided email", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "actor-1" } },
      error: null,
    });
    mockProfilesTableResponses({ actorPlatformRole: "superadmin", targetProfileId: null });

    const response = await POST(
      new Request("http://localhost/api/admin/dev-password-reset", {
        method: "POST",
        headers: {
          Authorization: "Bearer token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "missing.user@example.com", password: "password123" }),
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({ ok: false, reason: "email-not-found" });
  });
});
