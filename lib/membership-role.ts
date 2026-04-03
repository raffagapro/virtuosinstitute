export interface MembershipRoleSnapshot {
  school_role: string;
  is_active: boolean;
  approval_status: string;
  created_at?: string | null;
  updated_at?: string | null;
}

const rolePriority: Record<string, number> = {
  school_owner: 0,
  direction: 1,
  coordination: 2,
  teacher: 3,
  clerk: 4,
  parent: 5,
  student: 6,
  guest: 7,
};

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function sortNewestFirst(left: MembershipRoleSnapshot, right: MembershipRoleSnapshot): number {
  const leftUpdated = toTimestamp(left.updated_at);
  const rightUpdated = toTimestamp(right.updated_at);
  if (leftUpdated !== rightUpdated) {
    return rightUpdated - leftUpdated;
  }

  const leftCreated = toTimestamp(left.created_at);
  const rightCreated = toTimestamp(right.created_at);
  return rightCreated - leftCreated;
}

function sortByEffectiveRoleThenNewest(left: MembershipRoleSnapshot, right: MembershipRoleSnapshot): number {
  const leftPriority = rolePriority[left.school_role] ?? Number.MAX_SAFE_INTEGER;
  const rightPriority = rolePriority[right.school_role] ?? Number.MAX_SAFE_INTEGER;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return sortNewestFirst(left, right);
}

export function getDisplayMembershipRole(memberships: MembershipRoleSnapshot[]): string | null {
  const activeApproved = memberships
    .filter((membership) => membership.is_active && membership.approval_status === "approved")
    .sort(sortByEffectiveRoleThenNewest);

  if (activeApproved.length > 0) {
    return activeApproved[0].school_role;
  }

  const pending = memberships
    .filter((membership) => membership.approval_status === "pending")
    .sort(sortNewestFirst);

  if (pending.length > 0) {
    return pending[0].school_role;
  }

  const activeFallback = memberships.filter((membership) => membership.is_active).sort(sortNewestFirst);
  if (activeFallback.length > 0) {
    return activeFallback[0].school_role;
  }

  return null;
}

export function hasPendingAuthorization(memberships: MembershipRoleSnapshot[]): boolean {
  const hasActiveApproved = memberships.some(
    (membership) => membership.is_active && membership.approval_status === "approved"
  );

  if (hasActiveApproved) {
    return false;
  }

  return memberships.some((membership) => membership.approval_status === "pending");
}
