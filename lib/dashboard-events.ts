export const SUPERADMIN_PENDING_USERS_REFRESH_EVENT = "superadmin-pending-users-refresh";

export function emitSuperadminPendingUsersRefresh(source?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, {
      detail: source ? { source } : undefined,
    })
  );
}
