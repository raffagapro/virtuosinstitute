import { deriveParentApprovalStatus, resolveProfileIdentity } from "@/lib/platform-onboarding";

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
