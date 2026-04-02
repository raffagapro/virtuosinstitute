"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  ClipboardList,
  Crown,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface AppDashboardNavbarProps {
  logoAriaLabel: string;
  profileLabel: string;
  signOutLabel: string;
  signingOutLabel: string;
  loadingIdentityLabel: string;
  roleSuperadminLabel: string;
  roleStaffLabel: string;
  roleParentLabel: string;
  onSignedOutRedirect?: (path: string) => void;
}

interface NavbarContextResponse {
  ok: boolean;
  fullName: string | null;
  email: string | null;
  effectiveRole: "superadmin" | "staff" | "parent";
  highestRole: string | null;
  profilePath: string;
}

interface ProfileUpdatedDetail {
  fullName?: string | null;
  email?: string | null;
}

type BadgeTone =
  | "superadmin"
  | "school_owner"
  | "direction"
  | "coordination"
  | "teacher"
  | "clerk"
  | "parent"
  | "student"
  | "guest";

const badgeToneClasses: Record<BadgeTone, string> = {
  superadmin: "bg-[#E5E4E2] text-[#003F60]", // platinum
  school_owner: "bg-[#D4AF37] text-[#003F60]", // gold
  direction: "bg-[#C084FC] text-white",
  coordination: "bg-[#60A5FA] text-white",
  teacher: "bg-[#34D399] text-[#003F60]",
  clerk: "bg-[#22D3EE] text-[#003F60]",
  parent: "bg-[#94A3B8] text-white",
  student: "bg-[#CBD5E1] text-[#003F60]",
  guest: "bg-[#E2E8F0] text-[#003F60]",
};

const badgeIconByTone: Record<BadgeTone, ComponentType<{ className?: string }>> = {
  superadmin: ShieldCheck,
  school_owner: Crown,
  direction: UserCog,
  coordination: Briefcase,
  teacher: GraduationCap,
  clerk: ClipboardList,
  parent: Users,
  student: UserCheck,
  guest: UserRound,
};

export function AppDashboardNavbar({
  logoAriaLabel,
  profileLabel,
  signOutLabel,
  signingOutLabel,
  loadingIdentityLabel,
  roleSuperadminLabel,
  roleStaffLabel,
  roleParentLabel,
  onSignedOutRedirect,
}: AppDashboardNavbarProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const pathname = usePathname() ?? "";
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [badgeTone, setBadgeTone] = useState<BadgeTone | null>(null);
  const [profilePath, setProfilePath] = useState("/platfrom/dashboard/parent/profile");

  useEffect(() => {
    let isCancelled = false;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const loadNavbarContext = async () => {
      attempts += 1;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sessionEmail = session?.user?.email ?? null;
      if (!isCancelled && sessionEmail) {
        setEmail((previous) => previous ?? sessionEmail);
      }

      if (!session?.access_token) {
        if (attempts < 5 && !isCancelled) {
          retryTimer = setTimeout(() => {
            void loadNavbarContext();
          }, 400);
        }
        return;
      }

      const response = await fetch("/api/auth/navbar-context", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (attempts < 5 && !isCancelled) {
          retryTimer = setTimeout(() => {
            void loadNavbarContext();
          }, 400);
        }
        return;
      }

      const payload = (await response.json()) as NavbarContextResponse;
      if (!payload.ok || isCancelled) {
        return;
      }

      setDisplayName(payload.fullName);
      setEmail(payload.email);
      setBadgeTone((payload.highestRole as BadgeTone | null) ?? null);
      setProfilePath(payload.profilePath);
    };

    void loadNavbarContext();

    return () => {
      isCancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [supabase]);

  useEffect(() => {
    const onProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileUpdatedDetail>;
      const fullName = customEvent.detail?.fullName;
      const emailValue = customEvent.detail?.email;

      if (typeof fullName === "string") {
        setDisplayName(fullName);
      }

      if (typeof emailValue === "string") {
        setEmail(emailValue);
      }
    };

    window.addEventListener("app:profile-updated", onProfileUpdated as EventListener);

    return () => {
      window.removeEventListener("app:profile-updated", onProfileUpdated as EventListener);
    };
  }, []);

  const fallbackBadgeTone: BadgeTone = pathname.includes("/superadmin/") || pathname.endsWith("/superadmin")
    ? "superadmin"
    : pathname.includes("/staff/") || pathname.endsWith("/staff")
      ? "coordination"
      : "parent";
  const visibleBadgeTone = badgeTone ?? fallbackBadgeTone;
  const BadgeIcon = badgeIconByTone[visibleBadgeTone];

  const identityLabel = displayName && displayName.trim().length > 0 ? displayName : email;

  const onSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      if (onSignedOutRedirect) {
        onSignedOutRedirect("/platfrom");
      } else {
        window.location.assign("/platfrom");
      }
    }
  };

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      style={{ backgroundColor: "#002b50", boxShadow: "0 1px 0 rgba(0,0,0,0.1)" }}
    >
      <div className="flex h-[70px] w-full items-center justify-between px-8">
        <a href="/" aria-label={logoAriaLabel} className="shrink-0">
          <Image
            src="https://virtuosinstitute.com.mx/wp-content/uploads/2025/01/Recurso-6virtuos-logo-980x380.png"
            alt={logoAriaLabel}
            width={120}
            height={46}
            priority
            unoptimized
          />
        </a>

        <div className="flex items-center gap-3">
          <Link
            href={profilePath}
            aria-label={profileLabel}
            className="relative inline-flex items-center font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white transition-colors leading-[1] px-[13px] py-[11px] rounded-[23px] bg-[#36e7e1] hover:bg-[#FDCC00]"
            title={
              visibleBadgeTone === "superadmin"
                ? roleSuperadminLabel
                : visibleBadgeTone === "parent" || visibleBadgeTone === "student" || visibleBadgeTone === "guest"
                  ? roleParentLabel
                  : roleStaffLabel
            }
          >
            <span className="max-w-[220px] truncate">{identityLabel || loadingIdentityLabel}</span>
            <span
              data-testid="profile-role-badge"
              className={`absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 leading-none ring-2 ring-[#002b50] ${badgeToneClasses[visibleBadgeTone]}`}
            >
              <BadgeIcon className="h-2.5 w-2.5" />
            </span>
          </Link>

          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="inline-flex items-center font-['Sora',Helvetica,Arial,sans-serif] font-semibold text-[13px] uppercase tracking-[1px] text-white transition-colors leading-[1] px-[13px] py-[11px] rounded-[23px] bg-[#fa4361] hover:bg-[#FDCC00] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSigningOut ? signingOutLabel : signOutLabel}
          </button>
        </div>
      </div>
    </header>
  );
}
