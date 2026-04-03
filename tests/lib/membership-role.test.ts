import { getDisplayMembershipRole, hasPendingAuthorization, type MembershipRoleSnapshot } from "@/lib/membership-role";

function membership(overrides: Partial<MembershipRoleSnapshot>): MembershipRoleSnapshot {
  return {
    school_role: "guest",
    is_active: false,
    approval_status: "pending",
    created_at: "2026-04-01T00:00:00.000Z",
    updated_at: "2026-04-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("membership-role helpers", () => {
  it("returns the highest-priority active approved role for display", () => {
    const memberships = [
      membership({ school_role: "parent", is_active: true, approval_status: "approved", updated_at: "2026-04-03T00:00:00.000Z" }),
      membership({ school_role: "school_owner", is_active: true, approval_status: "approved", updated_at: "2026-04-01T00:00:00.000Z" }),
    ];

    expect(getDisplayMembershipRole(memberships)).toBe("school_owner");
  });

  it("falls back to newest pending role when no active approved membership exists", () => {
    const memberships = [
      membership({ school_role: "guest", is_active: false, approval_status: "pending", updated_at: "2026-04-01T00:00:00.000Z" }),
      membership({ school_role: "parent", is_active: false, approval_status: "pending", updated_at: "2026-04-02T00:00:00.000Z" }),
    ];

    expect(getDisplayMembershipRole(memberships)).toBe("parent");
  });

  it("reports pending authorization only when no active approved role exists", () => {
    const pendingOnly = [
      membership({ school_role: "parent", is_active: false, approval_status: "pending" }),
    ];

    const activeApprovedAndPending = [
      membership({ school_role: "parent", is_active: true, approval_status: "approved" }),
      membership({ school_role: "guest", is_active: false, approval_status: "pending" }),
    ];

    expect(hasPendingAuthorization(pendingOnly)).toBe(true);
    expect(hasPendingAuthorization(activeApprovedAndPending)).toBe(false);
  });
});
