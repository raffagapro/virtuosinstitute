export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";

interface DeriveStatusInput {
  membershipStatus: ApprovalStatus | null;
  requestStatus: ApprovalStatus | null;
}

// Membership approval is the source of truth for access gating.
// Approval requests are used as a fallback during onboarding bootstrap.
export function deriveParentApprovalStatus({
  membershipStatus,
  requestStatus,
}: DeriveStatusInput): ApprovalStatus {
  if (membershipStatus === "approved" || requestStatus === "approved") {
    return "approved";
  }

  if (membershipStatus === "suspended" || requestStatus === "suspended") {
    return "suspended";
  }

  if (membershipStatus === "rejected" || requestStatus === "rejected") {
    return "rejected";
  }

  return "pending";
}

export function resolveProfileIdentity(input: {
  fullNameCandidate?: string | null;
  email?: string | null;
}) {
  const cleanEmail = input.email?.trim().toLowerCase() ?? null;
  const cleanName = input.fullNameCandidate?.trim();

  return {
    fullName: cleanName && cleanName.length > 0 ? cleanName : "Virtuos Parent",
    email: cleanEmail,
  };
}
