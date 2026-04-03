export type SchoolRole =
  | "school_owner"
  | "direction"
  | "coordination"
  | "teacher"
  | "clerk"
  | "parent"
  | "student"
  | "guest";

export type ActorScope = "superadmin" | "school_owner" | "coordination" | "none";

type MembershipRoleShape = {
  school_role?: string | null;
  schoolRole?: string | null;
  is_active?: boolean | null;
  isActive?: boolean | null;
  approval_status?: string | null;
  approvalStatus?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  updated_at?: string | null;
  updatedAt?: string | null;
};

const allMembershipRoles: SchoolRole[] = [
  "school_owner",
  "direction",
  "coordination",
  "teacher",
  "clerk",
  "parent",
  "student",
  "guest",
];

const rolePriority: Record<SchoolRole, number> = {
  school_owner: 0,
  direction: 1,
  coordination: 2,
  teacher: 3,
  clerk: 4,
  parent: 5,
  student: 6,
  guest: 7,
};

function isSchoolRole(value: string | null | undefined): value is SchoolRole {
  return Boolean(value && allMembershipRoles.includes(value as SchoolRole));
}

function getMembershipRoleValue(membership: MembershipRoleShape): SchoolRole | null {
  const role = membership.school_role ?? membership.schoolRole ?? null;
  return isSchoolRole(role) ? role : null;
}

function getMembershipIsActive(membership: MembershipRoleShape): boolean {
  return Boolean(membership.is_active ?? membership.isActive);
}

function getMembershipApprovalStatus(membership: MembershipRoleShape): string {
  return membership.approval_status ?? membership.approvalStatus ?? "";
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function sortNewestFirst(left: MembershipRoleShape, right: MembershipRoleShape): number {
  const leftUpdated = toTimestamp(left.updated_at ?? left.updatedAt);
  const rightUpdated = toTimestamp(right.updated_at ?? right.updatedAt);
  if (leftUpdated !== rightUpdated) {
    return rightUpdated - leftUpdated;
  }

  const leftCreated = toTimestamp(left.created_at ?? left.createdAt);
  const rightCreated = toTimestamp(right.created_at ?? right.createdAt);
  return rightCreated - leftCreated;
}

function sortByRolePriorityThenNewest(left: MembershipRoleShape, right: MembershipRoleShape): number {
  const leftRole = getMembershipRoleValue(left);
  const rightRole = getMembershipRoleValue(right);
  const leftPriority = leftRole ? rolePriority[leftRole] : Number.MAX_SAFE_INTEGER;
  const rightPriority = rightRole ? rolePriority[rightRole] : Number.MAX_SAFE_INTEGER;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return sortNewestFirst(left, right);
}

export function getAssignableRoles(actorScope: ActorScope): SchoolRole[] {
  if (actorScope === "superadmin") {
    return [...allMembershipRoles];
  }

  if (actorScope === "school_owner") {
    return ["direction", "coordination", "teacher", "clerk", "parent", "student", "guest"];
  }

  if (actorScope === "coordination") {
    return ["teacher", "clerk", "parent", "student", "guest"];
  }

  return [];
}

export function canAssignRole(actorScope: ActorScope, targetRole: SchoolRole): boolean {
  return getAssignableRoles(actorScope).includes(targetRole);
}

export function getHighestPrioritySchoolRole(roles: string[]): SchoolRole | null {
  const schoolRoles = roles.filter((role): role is SchoolRole => isSchoolRole(role));
  if (schoolRoles.length === 0) {
    return null;
  }

  return [...schoolRoles].sort((left, right) => rolePriority[left] - rolePriority[right])[0] ?? null;
}

export function getEffectiveSchoolRole(memberships: MembershipRoleShape[]): SchoolRole | null {
  const activeApproved = memberships
    .filter((membership) => getMembershipIsActive(membership) && getMembershipApprovalStatus(membership) === "approved")
    .sort(sortByRolePriorityThenNewest)
    .map(getMembershipRoleValue)
    .filter((role): role is SchoolRole => Boolean(role));

  if (activeApproved.length > 0) {
    return activeApproved[0];
  }

  const pending = memberships
    .filter((membership) => getMembershipApprovalStatus(membership) === "pending")
    .sort(sortNewestFirst)
    .map(getMembershipRoleValue)
    .filter((role): role is SchoolRole => Boolean(role));

  if (pending.length > 0) {
    return pending[0];
  }

  const activeFallback = memberships
    .filter((membership) => getMembershipIsActive(membership))
    .sort(sortNewestFirst)
    .map(getMembershipRoleValue)
    .filter((role): role is SchoolRole => Boolean(role));

  if (activeFallback.length > 0) {
    return activeFallback[0];
  }

  return getHighestPrioritySchoolRole(
    memberships
      .map(getMembershipRoleValue)
      .filter((role): role is SchoolRole => Boolean(role))
  );
}

export function getEffectiveManagementRole(input: {
  platformRole?: string | null;
  memberships?: MembershipRoleShape[];
  membershipRoles?: string[];
}): "superadmin" | SchoolRole | null {
  if (input.platformRole === "superadmin") {
    return "superadmin";
  }

  if (input.memberships && input.memberships.length > 0) {
    return getEffectiveSchoolRole(input.memberships);
  }

  if (input.membershipRoles && input.membershipRoles.length > 0) {
    return getHighestPrioritySchoolRole(input.membershipRoles);
  }

  return null;
}

export function canManageTargetRole(actorScope: ActorScope, targetRole: "superadmin" | SchoolRole | null): boolean {
  if (actorScope === "none") {
    return false;
  }

  if (targetRole === "superadmin") {
    return actorScope === "superadmin";
  }

  if (targetRole === null) {
    return true;
  }

  return canAssignRole(actorScope, targetRole);
}
