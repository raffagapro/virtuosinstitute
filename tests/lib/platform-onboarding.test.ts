import {
  deriveParentApprovalStatus,
  resolveEffectiveDashboardRole,
  resolveHighestHierarchyRole,
  resolveDashboardPath,
  resolveProfileIdentity,
} from "@/lib/platform-onboarding";

describe("deriveParentApprovalStatus", () => {
  it("returns approved when membership is approved", () => {
    expect(
      deriveParentApprovalStatus({
        membershipStatus: "approved",
        requestStatus: "pending",
      })
    ).toBe("approved");
  });

  it("returns suspended when there is no approval and one source is suspended", () => {
    expect(
      deriveParentApprovalStatus({
        membershipStatus: "pending",
        requestStatus: "suspended",
      })
    ).toBe("suspended");
  });

  it("returns rejected when there is no approval and one source is rejected", () => {
    expect(
      deriveParentApprovalStatus({
        membershipStatus: "pending",
        requestStatus: "rejected",
      })
    ).toBe("rejected");
  });

  it("returns pending by default", () => {
    expect(
      deriveParentApprovalStatus({
        membershipStatus: null,
        requestStatus: null,
      })
    ).toBe("pending");
  });
});

describe("resolveProfileIdentity", () => {
  it("normalizes email and keeps provided full name", () => {
    expect(
      resolveProfileIdentity({
        fullNameCandidate: "  Parent Name  ",
        email: " Parent@Example.com ",
      })
    ).toEqual({
      fullName: "Parent Name",
      email: "parent@example.com",
    });
  });

  it("falls back to default full name when missing", () => {
    expect(
      resolveProfileIdentity({
        fullNameCandidate: "   ",
        email: null,
      })
    ).toEqual({
      fullName: "Virtuos Parent",
      email: null,
    });
  });
});

describe("resolveDashboardPath", () => {
  it("routes superadmin users to superadmin dashboard", () => {
    expect(
      resolveDashboardPath({
        platformRole: "superadmin",
        schoolRoles: ["parent"],
      })
    ).toBe("/platfrom/dashboard/superadmin");
  });

  it("routes staff roles to staff dashboard", () => {
    expect(
      resolveDashboardPath({
        platformRole: null,
        schoolRoles: ["teacher"],
      })
    ).toBe("/platfrom/dashboard/staff");
  });

  it("routes remaining approved users to parent dashboard", () => {
    expect(
      resolveDashboardPath({
        platformRole: null,
        schoolRoles: ["parent"],
      })
    ).toBe("/platfrom/dashboard/parent");
  });
});

describe("resolveEffectiveDashboardRole", () => {
  it("returns superadmin when platform role is superadmin", () => {
    expect(resolveEffectiveDashboardRole({ platformRole: "superadmin", schoolRoles: ["teacher"] })).toBe("superadmin");
  });

  it("returns staff when approved membership role is staff", () => {
    expect(resolveEffectiveDashboardRole({ platformRole: null, schoolRoles: ["coordination"] })).toBe("staff");
  });

  it("returns parent as fallback", () => {
    expect(resolveEffectiveDashboardRole({ platformRole: null, schoolRoles: ["parent"] })).toBe("parent");
  });
});

describe("resolveHighestHierarchyRole", () => {
  it("returns the strongest role by hierarchy", () => {
    expect(
      resolveHighestHierarchyRole({
        platformRole: null,
        schoolRoles: ["teacher", "school_owner"],
      })
    ).toBe("school_owner");
  });

  it("returns superadmin when platform role is superadmin", () => {
    expect(
      resolveHighestHierarchyRole({
        platformRole: "superadmin",
        schoolRoles: ["school_owner"],
      })
    ).toBe("superadmin");
  });
});
