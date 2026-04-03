import {
  canManageTargetRole,
  getEffectiveManagementRole,
  getEffectiveSchoolRole,
} from "@/lib/role-assignment-policy";

describe("role-assignment-policy hierarchy", () => {
  it("resolves highest-priority active approved school role", () => {
    const result = getEffectiveSchoolRole([
      { school_role: "parent", is_active: true, approval_status: "approved" },
      { school_role: "school_owner", is_active: true, approval_status: "approved" },
    ]);

    expect(result).toBe("school_owner");
  });

  it("resolves effective management role from platform role and memberships", () => {
    expect(
      getEffectiveManagementRole({
        platformRole: "superadmin",
        memberships: [{ school_role: "school_owner", is_active: true, approval_status: "approved" }],
      })
    ).toBe("superadmin");

    expect(
      getEffectiveManagementRole({
        memberships: [{ schoolRole: "coordination", isActive: true, approvalStatus: "approved" }],
      })
    ).toBe("coordination");
  });

  it("prevents coordination from managing owner and same-level roles", () => {
    expect(canManageTargetRole("coordination", "school_owner")).toBe(false);
    expect(canManageTargetRole("coordination", "direction")).toBe(false);
    expect(canManageTargetRole("coordination", "coordination")).toBe(false);
    expect(canManageTargetRole("coordination", "teacher")).toBe(true);
  });

  it("prevents owner from managing school owner accounts", () => {
    expect(canManageTargetRole("school_owner", "school_owner")).toBe(false);
    expect(canManageTargetRole("school_owner", "direction")).toBe(true);
  });
});