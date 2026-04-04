"use client";

import {
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CircleOff,
  ClipboardList,
  Crown,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  UserCircle2,
  Users,
} from "lucide-react";

export type AppUsersDirectoryStatusFilter = "all" | "active" | "inactive";
export type AppUsersDirectoryOrderFilter = "newest" | "oldest" | "name";

const roleActiveClassByValue: Record<string, string> = {
  all: "bg-[#36e7e1] text-white",
  school_owner: "bg-[#D4AF37] text-[#003F60]",
  direction: "bg-[#C084FC] text-white",
  coordination: "bg-[#60A5FA] text-white",
  teacher: "bg-[#34D399] text-[#003F60]",
  clerk: "bg-[#22D3EE] text-[#003F60]",
  parent: "bg-[#EC4899] text-white",
  student: "bg-[#36e7e1] text-[#003F60]",
  guest: "bg-[#E2E8F0] text-[#003F60]",
};

interface AppUsersDirectoryControlsProps {
  searchTerm: string;
  onSearchTermChange: (nextValue: string) => void;
  searchPlaceholder: string;
  statusFilter: AppUsersDirectoryStatusFilter;
  onStatusFilterChange: (nextValue: AppUsersDirectoryStatusFilter) => void;
  statusAllLabel: string;
  statusActiveLabel: string;
  statusInactiveLabel: string;
  roleFilterLabel: string;
  roleFilter: string;
  onRoleFilterChange: (nextValue: string) => void;
  roleAllLabel: string;
  roleOptions: string[];
  roleValueLabels?: Partial<Record<string, string>>;
  orderFilter: AppUsersDirectoryOrderFilter;
  onOrderFilterChange: (nextValue: AppUsersDirectoryOrderFilter) => void;
  orderNewestLabel: string;
  orderOldestLabel: string;
  orderNameLabel: string;
}

export function AppUsersDirectoryControls({
  searchTerm,
  onSearchTermChange,
  searchPlaceholder,
  statusFilter,
  onStatusFilterChange,
  statusAllLabel,
  statusActiveLabel,
  statusInactiveLabel,
  roleFilterLabel,
  roleFilter,
  onRoleFilterChange,
  roleAllLabel,
  roleOptions,
  roleValueLabels,
  orderFilter,
  onOrderFilterChange,
  orderNewestLabel,
  orderOldestLabel,
  orderNameLabel,
}: AppUsersDirectoryControlsProps) {
  const formatRoleLabel = (roleValue: string) => {
    return roleValue
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  };

  const resolveRoleLabel = (roleValue: string) => {
    return roleValueLabels?.[roleValue] ?? formatRoleLabel(roleValue);
  };

  const getRoleIcon = (roleValue: string) => {
    if (roleValue === "school_owner") return Crown;
    if (roleValue === "direction") return Building2;
    if (roleValue === "coordination") return BriefcaseBusiness;
    if (roleValue === "teacher") return GraduationCap;
    if (roleValue === "clerk") return ClipboardList;
    if (roleValue === "parent") return HeartHandshake;
    if (roleValue === "student") return BookOpen;
    if (roleValue === "guest") return UserCircle2;
    return Users;
  };

  const statusButtonClass = (isSelected: boolean) => {
    return `inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      isSelected ? "bg-[#36e7e1] text-white" : "border bg-white text-[#2b5876] hover:bg-white"
    }`;
  };

  const orderButtonClass = (isSelected: boolean) => {
    return `inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      isSelected ? "bg-[#fa4361] text-white" : "border bg-white text-[#2b5876] hover:bg-white"
    }`;
  };

  const roleButtonClass = (roleValue: string, isSelected: boolean) => {
    const selectedClass = roleActiveClassByValue[roleValue] ?? roleActiveClassByValue.all;
    return `inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
      isSelected ? selectedClass : "border bg-white text-[#2b5876] hover:bg-white"
    }`;
  };

  return (
    <div className="space-y-3 rounded-xl border border-[#e4eef7] bg-[#f5fbff] p-4">
      <input
        type="search"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.target.value)}
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
      />

      <div className="flex flex-wrap items-center gap-3 md:flex-nowrap md:justify-between">
        <div className="flex items-center gap-2">
        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            aria-label={statusAllLabel}
            className={statusButtonClass(statusFilter === "all")}
          >
            <Users className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {statusAllLabel}
          </div>
        </div>

        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onStatusFilterChange("active")}
            aria-label={statusActiveLabel}
            className={statusButtonClass(statusFilter === "active")}
          >
            <ShieldCheck className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {statusActiveLabel}
          </div>
        </div>

        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onStatusFilterChange("inactive")}
            aria-label={statusInactiveLabel}
            className={statusButtonClass(statusFilter === "inactive")}
          >
            <CircleOff className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {statusInactiveLabel}
          </div>
        </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-2 md:flex-1"
          aria-label={roleFilterLabel}
          role="group"
        >
          <span className="sr-only">{roleFilterLabel}</span>

          <div className="group relative inline-flex">
            <button
              type="button"
              onClick={() => onRoleFilterChange("all")}
              aria-label={roleAllLabel}
              className={roleButtonClass("all", roleFilter === "all")}
            >
              <Users className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              {roleAllLabel}
            </div>
          </div>

          {roleOptions.map((role) => {
            const RoleIcon = getRoleIcon(role);
            const roleLabel = resolveRoleLabel(role);
            return (
              <div key={role} className="group relative inline-flex">
                <button
                  type="button"
                  onClick={() => onRoleFilterChange(role)}
                  aria-label={roleLabel}
                  className={roleButtonClass(role, roleFilter === role)}
                >
                  <RoleIcon className="h-4 w-4" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {roleLabel}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onOrderFilterChange("newest")}
            aria-label={orderNewestLabel}
            className={orderButtonClass(orderFilter === "newest")}
          >
            <ArrowDownNarrowWide className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {orderNewestLabel}
          </div>
        </div>

        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onOrderFilterChange("oldest")}
            aria-label={orderOldestLabel}
            className={orderButtonClass(orderFilter === "oldest")}
          >
            <ArrowUpNarrowWide className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {orderOldestLabel}
          </div>
        </div>

        <div className="group relative inline-flex">
          <button
            type="button"
            onClick={() => onOrderFilterChange("name")}
            aria-label={orderNameLabel}
            className={orderButtonClass(orderFilter === "name")}
          >
            <ArrowDownAZ className="h-4 w-4" />
          </button>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
            {orderNameLabel}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
