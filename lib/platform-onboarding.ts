export type ApprovalStatus = "pending" | "approved" | "rejected" | "suspended";
export type DashboardPath = "/platfrom/dashboard/superadmin" | "/platfrom/dashboard/staff" | "/platfrom/dashboard/parent";
export type EffectiveDashboardRole = "superadmin" | "staff" | "parent";
export type HierarchyRole =
  | "superadmin"
  | "school_owner"
  | "direction"
  | "coordination"
  | "teacher"
  | "clerk"
  | "parent"
  | "student"
  | "guest";

const STAFF_ROLES = new Set(["school_owner", "direction", "coordination", "teacher", "clerk"]);
const HIERARCHY_ORDER: HierarchyRole[] = [
  "superadmin",
  "school_owner",
  "direction",
  "coordination",
  "teacher",
  "clerk",
  "parent",
  "student",
  "guest",
];
const HIERARCHY_SET = new Set(HIERARCHY_ORDER);

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

export function resolveDashboardPath(input: {
  platformRole?: string | null;
  schoolRoles?: string[];
}): DashboardPath {
  const role = resolveEffectiveDashboardRole(input);
  if (role === "superadmin") {
    return "/platfrom/dashboard/superadmin";
  }

  if (role === "staff") {
    return "/platfrom/dashboard/staff";
  }

  return "/platfrom/dashboard/parent";
}

export function resolveEffectiveDashboardRole(input: {
  platformRole?: string | null;
  schoolRoles?: string[];
}): EffectiveDashboardRole {
  const highestRole = resolveHighestHierarchyRole(input);
  if (highestRole === "superadmin") {
    return "superadmin";
  }

  if (highestRole && STAFF_ROLES.has(highestRole)) {
    return "staff";
  }

  return "parent";
}

export function resolveHighestHierarchyRole(input: {
  platformRole?: string | null;
  schoolRoles?: string[];
}): HierarchyRole | null {
  const candidates = new Set<HierarchyRole>();

  if (input.platformRole === "superadmin") {
    candidates.add("superadmin");
  }

  (input.schoolRoles ?? []).forEach((role) => {
    const normalizedRole = role.trim().toLowerCase() as HierarchyRole;
    if (HIERARCHY_SET.has(normalizedRole)) {
      candidates.add(normalizedRole);
    }
  });

  if (candidates.size === 0) {
    return null;
  }

  for (const role of HIERARCHY_ORDER) {
    if (candidates.has(role)) {
      return role;
    }
  }

  return null;
}
