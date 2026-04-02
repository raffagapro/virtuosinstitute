"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export interface AppDashboardSidebarItem {
  href: string;
  label: string;
}

interface AppDashboardSidebarProps {
  ariaLabel?: string;
  items: AppDashboardSidebarItem[];
}

export function AppDashboardSidebar({ ariaLabel = "Dashboard pages", items }: AppDashboardSidebarProps) {
  const pathname = usePathname() ?? "";
  const matchingHrefs = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  const activeHref = matchingHrefs.sort((a, b) => b.length - a.length)[0] ?? null;

  return (
    <aside className="w-full self-start rounded-2xl border border-[#d6e8f6] bg-white p-4 md:h-fit md:w-72 md:shrink-0">
      <nav className="flex flex-col gap-1" aria-label={ariaLabel}>
        {items.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-3 font-['Sora',Helvetica,Arial,sans-serif] text-sm font-semibold uppercase tracking-[0.8px] transition-colors",
                isActive
                  ? "bg-[#003F60] text-white"
                  : "bg-white text-[#003F60] hover:bg-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
