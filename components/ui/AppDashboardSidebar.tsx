"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SUPERADMIN_PENDING_USERS_REFRESH_EVENT } from "@/lib/dashboard-events";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export interface AppDashboardSidebarItem {
  href: string;
  label: string;
  showPendingAuthBadge?: boolean;
}

interface AppDashboardSidebarProps {
  ariaLabel?: string;
  items: AppDashboardSidebarItem[];
  pendingUsersBadgeLabel?: string;
}

interface SidebarUsersDirectoryResponse {
  ok: boolean;
  users?: Array<{ hasPendingAuthorization: boolean }>;
}

export function AppDashboardSidebar({
  ariaLabel = "Dashboard pages",
  items,
  pendingUsersBadgeLabel,
}: AppDashboardSidebarProps) {
  const shouldEnablePendingBadge = (item: AppDashboardSidebarItem) => {
    if (typeof item.showPendingAuthBadge === "boolean") {
      return item.showPendingAuthBadge;
    }

    return item.href.endsWith("/users");
  };

  const pathname = usePathname() ?? "";
  const [pendingUsersCount, setPendingUsersCount] = useState<number | null>(null);
  const shouldLoadPendingAuthCount = useMemo(
    () => items.some((item) => shouldEnablePendingBadge(item)),
    [items]
  );
  const matchingHrefs = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  const activeHref = matchingHrefs.sort((a, b) => b.length - a.length)[0] ?? null;

  useEffect(() => {
    let isCancelled = false;
    let activeRequestId = 0;

    const fetchPendingUsersCount = async () => {
      if (!shouldLoadPendingAuthCount) {
        return;
      }

      activeRequestId += 1;
      const requestId = activeRequestId;

      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token || isCancelled || requestId !== activeRequestId) {
        return;
      }

      const response = await fetch("/api/admin/users-directory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok || isCancelled || requestId !== activeRequestId) {
        return;
      }

      const payload = (await response.json()) as SidebarUsersDirectoryResponse;
      if (!payload.ok || !payload.users || isCancelled || requestId !== activeRequestId) {
        return;
      }

      const nextPendingCount = payload.users.reduce((count, user) => {
        return user.hasPendingAuthorization ? count + 1 : count;
      }, 0);

      setPendingUsersCount(nextPendingCount);
    };

    const handleRefreshEvent = () => {
      void fetchPendingUsersCount();
    };

    void fetchPendingUsersCount();

    window.addEventListener(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, handleRefreshEvent as EventListener);

    return () => {
      isCancelled = true;
      window.removeEventListener(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, handleRefreshEvent as EventListener);
    };
  }, [pathname, shouldLoadPendingAuthCount]);

  return (
    <aside className="w-full self-start rounded-2xl border border-[#d6e8f6] bg-white p-4 md:h-fit md:w-72 md:shrink-0">
      <nav className="flex flex-col gap-1" aria-label={ariaLabel}>
        {items.map((item) => {
          const isActive = activeHref === item.href;
          const shouldShowBadge = shouldEnablePendingBadge(item) && (pendingUsersCount ?? 0) > 0;
          const pendingCountValue = pendingUsersCount ?? 0;
          const pendingCountText = pendingCountValue > 99 ? "99+" : String(pendingCountValue);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-xl px-4 py-3 font-['Sora',Helvetica,Arial,sans-serif] text-sm font-semibold uppercase tracking-[0.8px] transition-colors",
                isActive
                  ? "bg-[#003F60] text-white"
                  : "bg-white text-[#003F60] hover:bg-white"
              )}
              aria-label={item.label}
            >
              <span className="inline-flex items-center gap-2">
                <span>{item.label}</span>
                {shouldShowBadge ? (
                  <span
                    className={cn(
                      "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold leading-none",
                      isActive ? "bg-[#fa4361] text-white" : "bg-[#fa4361] text-white"
                    )}
                    aria-hidden="true"
                  >
                    {pendingCountText}
                  </span>
                ) : null}
              </span>
              {shouldShowBadge ? (
                <>
                  {pendingUsersBadgeLabel ? (
                    <span className="sr-only">{pendingUsersBadgeLabel.replace("{count}", String(pendingCountValue))}</span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
