"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import {
  AlertCircle,
  ArrowDownAZ,
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  CheckCircle2,
  CircleOff,
  ShieldCheck,
  Users,
  Crown,
  UserCog,
  Briefcase,
  GraduationCap,
  ClipboardList,
  UserCheck,
  UserRound,
  X,
  Pencil,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface UserDirectoryEntry {
  id: string;
  fullName: string | null;
  email: string | null;
  platformRole: string | null;
  isActive: boolean;
  hasPendingAuthorization: boolean;
  preferredLocale: string;
  createdAt: string;
  membershipRoles: string[];
}

interface ProfileMembership {
  schoolRole: string;
  approvalStatus: "pending" | "approved" | "rejected" | "suspended";
  isActive: boolean;
}

interface ProfileParentDetails {
  curp: string;
  rfc: string | null;
  profession: string | null;
  invoiceRequired: boolean;
}

interface ProfileModalDetails {
  profile: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
    preferredLocale: string;
    platformRole: string | null;
    isActive: boolean;
  };
  memberships: ProfileMembership[];
  parentProfile?: ProfileParentDetails | null;
}

type StatusFilter = "all" | "active" | "inactive";
type OrderFilter = "newest" | "oldest" | "name";

type BadgeTone = "superadmin" | "school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest";

const roleBadgeConfig: Record<
  BadgeTone,
  {
    bgColor: string;
    lightBgColor: string;
    textColor: string;
    icon: ComponentType<{ className?: string }>;
  }
> = {
  superadmin: {
    bgColor: "bg-[#E5E4E2]",
    lightBgColor: "bg-[#F5F4F3]",
    textColor: "text-[#003F60]",
    icon: ShieldCheck,
  },
  school_owner: {
    bgColor: "bg-[#D4AF37]",
    lightBgColor: "bg-[#EEE5D0]",
    textColor: "text-[#003F60]",
    icon: Crown,
  },
  direction: {
    bgColor: "bg-[#C084FC]",
    lightBgColor: "bg-[#F0E5FF]",
    textColor: "text-white",
    icon: UserCog,
  },
  coordination: {
    bgColor: "bg-[#60A5FA]",
    lightBgColor: "bg-[#E0F2FF]",
    textColor: "text-white",
    icon: Briefcase,
  },
  teacher: {
    bgColor: "bg-[#34D399]",
    lightBgColor: "bg-[#E0F9F5]",
    textColor: "text-[#003F60]",
    icon: GraduationCap,
  },
  clerk: {
    bgColor: "bg-[#22D3EE]",
    lightBgColor: "bg-[#E0F7FF]",
    textColor: "text-[#003F60]",
    icon: ClipboardList,
  },
  parent: {
    bgColor: "bg-[#94A3B8]",
    lightBgColor: "bg-[#F0F5FA]",
    textColor: "text-white",
    icon: Users,
  },
  student: {
    bgColor: "bg-[#CBD5E1]",
    lightBgColor: "bg-[#F0F4F8]",
    textColor: "text-[#003F60]",
    icon: UserCheck,
  },
  guest: {
    bgColor: "bg-[#E2E8F0]",
    lightBgColor: "bg-[#F8FAFC]",
    textColor: "text-[#003F60]",
    icon: UserRound,
  },
};

interface SuperadminUsersDirectoryProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyLabel: string;
  loadingLabel: string;
  errorLabel: string;
  statusAllLabel: string;
  statusActiveLabel: string;
  statusInactiveLabel: string;
  statusPendingAuthorizationLabel: string;
  roleFilterLabel: string;
  roleAllLabel: string;
  orderNewestLabel: string;
  orderOldestLabel: string;
  orderNameLabel: string;
  statusColumnLabel: string;
  fullNameColumnLabel: string;
  emailColumnLabel: string;
  platformRoleColumnLabel: string;
  membershipRolesColumnLabel: string;
  pendingStatusLabel: string;
  authorizeModalTitle: string;
  authorizeModalUserLabel: string;
  authorizeModalEmailLabel: string;
  authorizeModalRoleLabel: string;
  authorizeModalCancelLabel: string;
  authorizeModalConfirmLabel: string;
  authorizeModalSubmittingLabel: string;
  authorizeModalErrorLabel: string;
  roleOptionSchoolOwnerLabel: string;
  roleOptionDirectionLabel: string;
  roleOptionCoordinationLabel: string;
  roleOptionTeacherLabel: string;
  roleOptionClerkLabel: string;
  roleOptionParentLabel: string;
  roleOptionStudentLabel: string;
  roleOptionGuestLabel: string;
  profileModalTitle: string;
  profileModalFullName: string;
  profileModalEmail: string;
  profileModalPhone: string;
  profileModalDateOfBirth: string;
  profileModalLanguage: string;
  profileModalCurp?: string;
  profileModalRfc?: string;
  profileModalProfession?: string;
  profileModalInvoiceRequired?: string;
  profileModalYes?: string;
  profileModalNo?: string;
  membershipRoleEditLabel?: string;
  membershipRoleSaveLabel?: string;
  membershipRoleSavingLabel?: string;
  membershipRoleErrorLabel?: string;
  profileModalCancel: string;
  profileModalSave: string;
  profileModalSaving: string;
  profileModalDeactivate: string;
  profileModalDeactivateConfirm: string;
  profileModalDeactivateButton: string;
  profileModalError: string;
  statusApprovedLabel?: string;
  statusRejectedLabel?: string;
  statusSuspendedLabel?: string;
}

export function SuperadminUsersDirectory({
  title,
  subtitle,
  searchPlaceholder,
  emptyLabel,
  loadingLabel,
  errorLabel,
  statusAllLabel,
  statusActiveLabel,
  statusInactiveLabel,
  statusPendingAuthorizationLabel,
  roleFilterLabel,
  roleAllLabel,
  orderNewestLabel,
  orderOldestLabel,
  orderNameLabel,
  statusColumnLabel,
  fullNameColumnLabel,
  emailColumnLabel,
  platformRoleColumnLabel,
  membershipRolesColumnLabel,
  pendingStatusLabel,
  authorizeModalTitle,
  authorizeModalUserLabel,
  authorizeModalEmailLabel,
  authorizeModalRoleLabel,
  authorizeModalCancelLabel,
  authorizeModalConfirmLabel,
  authorizeModalSubmittingLabel,
  authorizeModalErrorLabel,
  roleOptionSchoolOwnerLabel,
  roleOptionDirectionLabel,
  roleOptionCoordinationLabel,
  roleOptionTeacherLabel,
  roleOptionClerkLabel,
  roleOptionParentLabel,
  roleOptionStudentLabel,
  roleOptionGuestLabel,
  profileModalTitle,
  profileModalFullName,
  profileModalEmail,
  profileModalPhone,
  profileModalDateOfBirth,
  profileModalLanguage,
  profileModalCurp,
  profileModalRfc,
  profileModalProfession,
  profileModalInvoiceRequired,
  profileModalYes,
  profileModalNo,
  membershipRoleEditLabel,
  membershipRoleSaveLabel,
  membershipRoleSavingLabel,
  membershipRoleErrorLabel,
  profileModalCancel,
  profileModalSave,
  profileModalSaving,
  profileModalDeactivate,
  profileModalDeactivateConfirm,
  profileModalDeactivateButton,
  profileModalError,
  statusApprovedLabel,
  statusRejectedLabel,
  statusSuspendedLabel,
}: SuperadminUsersDirectoryProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);

  const roleLabels = useMemo(
    () => ({
      school_owner: roleOptionSchoolOwnerLabel,
      direction: roleOptionDirectionLabel,
      coordination: roleOptionCoordinationLabel,
      teacher: roleOptionTeacherLabel,
      clerk: roleOptionClerkLabel,
      parent: roleOptionParentLabel,
      student: roleOptionStudentLabel,
      guest: roleOptionGuestLabel,
    }),
    [
      roleOptionSchoolOwnerLabel,
      roleOptionDirectionLabel,
      roleOptionCoordinationLabel,
      roleOptionTeacherLabel,
      roleOptionClerkLabel,
      roleOptionParentLabel,
      roleOptionStudentLabel,
      roleOptionGuestLabel,
    ]
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("newest");
  const [selectedPendingUser, setSelectedPendingUser] = useState<UserDirectoryEntry | null>(null);
  const [assignedRole, setAssignedRole] = useState<"school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest">("parent");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);

  const [selectedProfileUser, setSelectedProfileUser] = useState<UserDirectoryEntry | null>(null);
  const [profileFormData, setProfileFormData] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    preferredLocale: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isProfileDetailsLoading, setIsProfileDetailsLoading] = useState(false);
  const [profileDetails, setProfileDetails] = useState<ProfileModalDetails | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [membershipRoleValue, setMembershipRoleValue] = useState<"school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest">("parent");
  const [isSavingMembershipRole, setIsSavingMembershipRole] = useState(false);
  const [isEditingMembershipRole, setIsEditingMembershipRole] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const approvalStatusLabels = useMemo(
    () => ({
      pending: pendingStatusLabel,
      approved: statusApprovedLabel,
      rejected: statusRejectedLabel,
      suspended: statusSuspendedLabel,
    }),
    [pendingStatusLabel, statusApprovedLabel, statusRejectedLabel, statusSuspendedLabel]
  );

  useEffect(() => {
    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchUsers = async () => {
      setIsLoading(true);
      setHasError(false);

      let sessionToken: string | null = null;

      // Session can be temporarily unavailable right after redirects/sign-in.
      // Retry a few times before treating it as an error.
      for (let attempt = 0; attempt < 5; attempt += 1) {
        if (isCancelled) {
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          sessionToken = session.access_token;
          break;
        }

        await new Promise<void>((resolve) => {
          retryTimer = setTimeout(() => resolve(), 350);
        });
      }

      if (!sessionToken) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      const response = await fetch("/api/admin/users-directory", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as { ok: boolean; users?: UserDirectoryEntry[] };
      if (!payload.ok || !payload.users) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setUsers(payload.users);
        setIsLoading(false);
      }
    };

    void fetchUsers();

    return () => {
      isCancelled = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [supabase]);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();
    users.forEach((user) => {
      if (user.platformRole && user.platformRole !== "superadmin") {
        uniqueRoles.add(user.platformRole);
      }
      user.membershipRoles.forEach((role) => uniqueRoles.add(role));
    });

    return Array.from(uniqueRoles).sort((a, b) => a.localeCompare(b));
  }, [users]);

  const visibleUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const filteredUsers = users.filter((user) => {
      const searchableName = user.fullName?.toLowerCase() ?? "";
      const searchableEmail = user.email?.toLowerCase() ?? "";
      const matchesSearch =
        query.length === 0 || searchableName.includes(query) || searchableEmail.includes(query);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? user.isActive
            : !user.isActive;

      const matchesRole =
        roleFilter === "all"
          ? true
          : user.platformRole === roleFilter || user.membershipRoles.includes(roleFilter);

      return matchesSearch && matchesStatus && matchesRole;
    });

    const sortedUsers = [...filteredUsers].sort((left, right) => {
      if (left.hasPendingAuthorization !== right.hasPendingAuthorization) {
        return left.hasPendingAuthorization ? -1 : 1;
      }

      if (orderFilter === "name") {
        const leftName = (left.fullName || left.email || "").toLowerCase();
        const rightName = (right.fullName || right.email || "").toLowerCase();
        return leftName.localeCompare(rightName);
      }

      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return orderFilter === "oldest" ? leftTime - rightTime : rightTime - leftTime;
    });

    return sortedUsers;
  }, [orderFilter, roleFilter, searchTerm, statusFilter, users]);

  const shouldRenderPlatformRole = useMemo(
    () => visibleUsers.some((user) => Boolean(user.platformRole)),
    [visibleUsers]
  );

  const roleAssignOptions = useMemo(
    () => [
      { value: "school_owner", label: roleOptionSchoolOwnerLabel },
      { value: "direction", label: roleOptionDirectionLabel },
      { value: "coordination", label: roleOptionCoordinationLabel },
      { value: "teacher", label: roleOptionTeacherLabel },
      { value: "clerk", label: roleOptionClerkLabel },
      { value: "parent", label: roleOptionParentLabel },
      { value: "student", label: roleOptionStudentLabel },
      { value: "guest", label: roleOptionGuestLabel },
    ],
    [
      roleOptionSchoolOwnerLabel,
      roleOptionDirectionLabel,
      roleOptionCoordinationLabel,
      roleOptionTeacherLabel,
      roleOptionClerkLabel,
      roleOptionParentLabel,
      roleOptionStudentLabel,
      roleOptionGuestLabel,
    ]
  );

  const openAuthorizeModal = (user: UserDirectoryEntry) => {
    setSelectedPendingUser(user);
    setAssignedRole("parent");
    setAuthorizeError(null);
  };

  const closeAuthorizeModal = () => {
    if (isAuthorizing) {
      return;
    }

    setSelectedPendingUser(null);
    setAuthorizeError(null);
  };

  const authorizePendingUser = async () => {
    if (!selectedPendingUser) {
      return;
    }

    setIsAuthorizing(true);
    setAuthorizeError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(errorLabel);
      }

      const response = await fetch("/api/admin/parent-approvals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: selectedPendingUser.id,
          status: "approved",
          assignedRole,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.reason || authorizeModalErrorLabel);
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (user.id !== selectedPendingUser.id) {
            return user;
          }

          return {
            ...user,
            hasPendingAuthorization: false,
            isActive: true,
            membershipRoles: [assignedRole],
          };
        })
      );

      setSelectedPendingUser(null);
    } catch (error) {
      setAuthorizeError(error instanceof Error ? error.message : authorizeModalErrorLabel);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const openProfileModal = async (user: UserDirectoryEntry) => {
    setSelectedProfileUser(user);
    setProfileDetails(null);
    setIsProfileDetailsLoading(true);
    setProfileFormData({
      fullName: user.fullName || "",
      phone: "",
      dateOfBirth: "",
      preferredLocale: user.preferredLocale || "",
    });
    setProfileError(null);
    setShowDeactivateConfirm(false);
    setIsEditingMembershipRole(false);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(profileModalError);
      }

      const response = await fetch(`/api/admin/user-profile?profileId=${encodeURIComponent(user.id)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || profileModalError);
      }

      const payload = (await response.json()) as {
        ok: boolean;
        profile?: ProfileModalDetails["profile"];
        memberships?: ProfileMembership[];
        parentProfile?: ProfileParentDetails | null;
      };

      if (!payload.ok || !payload.profile) {
        throw new Error(profileModalError);
      }

      setProfileFormData({
        fullName: payload.profile.fullName || "",
        phone: payload.profile.phone || "",
        dateOfBirth: payload.profile.dateOfBirth || "",
        preferredLocale: payload.profile.preferredLocale || user.preferredLocale || "es-MX",
      });

      setProfileDetails({
        profile: payload.profile,
        memberships: payload.memberships || [],
        parentProfile: payload.parentProfile,
      });

      const primaryMembership = (payload.memberships || []).find(
        (membership) => membership.isActive && membership.approvalStatus === "approved"
      ) ?? (payload.memberships || [])[0] ?? null;

      if (primaryMembership && roleAssignOptions.some((role) => role.value === primaryMembership.schoolRole)) {
        setMembershipRoleValue(primaryMembership.schoolRole as typeof membershipRoleValue);
      }
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : profileModalError);
    } finally {
      setIsProfileDetailsLoading(false);
    }
  };

  const closeProfileModal = () => {
    if (isSavingProfile || isSavingMembershipRole) {
      return;
    }

    setSelectedProfileUser(null);
    setProfileDetails(null);
    setProfileError(null);
    setIsSavingMembershipRole(false);
    setIsEditingMembershipRole(false);
  };

  const saveMembershipRoleChanges = async () => {
    if (!selectedProfileUser) {
      return;
    }

    setIsSavingMembershipRole(true);
    setProfileError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(membershipRoleErrorLabel || profileModalError);
      }

      const response = await fetch("/api/admin/user-membership-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: selectedProfileUser.id,
          schoolRole: membershipRoleValue,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.reason || membershipRoleErrorLabel || profileModalError);
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (user.id !== selectedProfileUser.id) {
            return user;
          }

          return {
            ...user,
            membershipRoles: [membershipRoleValue],
            isActive: true,
          };
        })
      );

      setProfileDetails((previous) => {
        if (!previous) {
          return previous;
        }

        return {
          ...previous,
          memberships: [
            {
              schoolRole: membershipRoleValue,
              approvalStatus: "approved",
              isActive: true,
            },
          ],
        };
      });

      setIsEditingMembershipRole(false);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : membershipRoleErrorLabel || profileModalError);
    } finally {
      setIsSavingMembershipRole(false);
    }
  };

  const saveProfileChanges = async () => {
    if (!selectedProfileUser) {
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(profileModalError);
      }

      const response = await fetch("/api/admin/user-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: selectedProfileUser.id,
          fullName: profileFormData.fullName || undefined,
          phone: profileFormData.phone || null,
          dateOfBirth: profileFormData.dateOfBirth || null,
          preferredLocale: profileFormData.preferredLocale || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || profileModalError);
      }

      const payload = (await response.json()) as {
        profile: ProfileModalDetails["profile"];
        memberships?: ProfileMembership[];
        parentProfile?: ProfileParentDetails | null;
      };

      const updatedProfile = payload.profile;

      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (user.id !== selectedProfileUser.id) {
            return user;
          }

          return {
            ...user,
            fullName: updatedProfile.fullName,
            preferredLocale: updatedProfile.preferredLocale,
          };
        })
      );

      setProfileDetails((previous) => {
        if (!previous) {
          return null;
        }

        return {
          profile: updatedProfile,
          memberships: payload.memberships || previous.memberships,
          parentProfile: payload.parentProfile ?? previous.parentProfile,
        };
      });

      setSelectedProfileUser(null);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : profileModalError);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const deactivateUser = async () => {
    if (!selectedProfileUser) {
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(profileModalError);
      }

      const response = await fetch("/api/admin/user-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          profileId: selectedProfileUser.id,
          isActive: false,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || profileModalError);
      }

      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (user.id !== selectedProfileUser.id) {
            return user;
          }

          return {
            ...user,
            isActive: false,
          };
        })
      );

      setSelectedProfileUser(null);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : profileModalError);
    } finally {
      setIsSavingProfile(false);
      setShowDeactivateConfirm(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
      <div>
        <h1 className="font-['Sora',Helvetica,Arial,sans-serif] text-2xl font-bold text-[#003F60] sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-[#2b5876] sm:text-base">{subtitle}</p>
      </div>

      {!isLoading && !hasError ? (
        <div className="space-y-3 rounded-xl border border-[#e4eef7] bg-[#f5fbff] p-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-xl border border-[#d6e8f6] bg-white px-4 py-2.5 text-sm text-[#003F60] outline-none transition focus:border-[#60A5FA]"
          />

          <div className="flex flex-wrap items-center gap-2">
            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                aria-label={statusAllLabel}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  statusFilter === "all"
                    ? "bg-[#36e7e1] text-white"
                    : "border bg-white text-[#2b5876] hover:bg-white"
                }`}
              >
                <Users className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {statusAllLabel}
              </div>
            </div>

            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                aria-label={statusActiveLabel}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  statusFilter === "active"
                    ? "bg-[#36e7e1] text-white"
                    : "border bg-white text-[#2b5876] hover:bg-white"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {statusActiveLabel}
              </div>
            </div>

            <div className="group relative inline-flex">
              <button
                type="button"
              onClick={() => setStatusFilter("inactive")}
              aria-label={statusInactiveLabel}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                statusFilter === "inactive"
                  ? "bg-[#36e7e1] text-white"
                  : "border bg-white text-[#2b5876] hover:bg-white"
              }`}
            >
              <CircleOff className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
              {statusInactiveLabel}
            </div>
            </div>

            <label className="ml-auto flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.8px] text-[#2b5876]">
              {roleFilterLabel}
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="rounded-lg border border-[#d6e8f6] bg-white px-2 py-1.5 text-xs text-[#003F60]"
              >
                <option value="all">{roleAllLabel}</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={() => setOrderFilter("newest")}
                aria-label={orderNewestLabel}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  orderFilter === "newest"
                    ? "bg-[#fa4361] text-white"
                    : "border bg-white text-[#2b5876] hover:bg-white"
                }`}
              >
                <ArrowDownNarrowWide className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {orderNewestLabel}
              </div>
            </div>

            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={() => setOrderFilter("oldest")}
                aria-label={orderOldestLabel}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  orderFilter === "oldest"
                    ? "bg-[#fa4361] text-white"
                    : "border bg-white text-[#2b5876] hover:bg-white"
                }`}
              >
                <ArrowUpNarrowWide className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {orderOldestLabel}
              </div>
            </div>

            <div className="group relative inline-flex">
              <button
                type="button"
                onClick={() => setOrderFilter("name")}
                aria-label={orderNameLabel}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  orderFilter === "name"
                    ? "bg-[#fa4361] text-white"
                    : "border bg-white text-[#2b5876] hover:bg-white"
                }`}
              >
                <ArrowDownAZ className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                {orderNameLabel}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-[#2b5876]">{loadingLabel}</p> : null}
      {hasError ? <p className="text-sm text-[#b51d3a]">{errorLabel}</p> : null}
      {!isLoading && !hasError && visibleUsers.length === 0 ? <p className="text-sm text-[#2b5876]">{emptyLabel}</p> : null}

      {!isLoading && !hasError && visibleUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-[#e4eef7]">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#f5fbff]">
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {fullNameColumnLabel}
                </th>
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {emailColumnLabel}
                </th>
                {shouldRenderPlatformRole ? (
                  <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                    {platformRoleColumnLabel}
                  </th>
                ) : null}
                <th className="px-4 py-3 text-left font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {membershipRolesColumnLabel}
                </th>
                <th className="px-4 py-3 text-center font-['Sora',Helvetica,Arial,sans-serif] text-xs font-bold uppercase tracking-[0.8px] text-[#2b5876]">
                  {statusColumnLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const rowBgColor =
                  user.membershipRoles.length > 0
                    ? roleBadgeConfig[user.membershipRoles[0] as BadgeTone]?.lightBgColor ||
                      ""
                    : "";

                return (
                  <tr key={user.id} className={`border-t border-[#eef4fa] ${rowBgColor}`}>
                    <td className="px-4 py-3 text-sm">
                      <button
                        type="button"
                        onClick={() => openProfileModal(user)}
                        className="text-[#003F60] hover:text-[#36e7e1] hover:underline font-medium"
                      >
                        {user.fullName || "-"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2b5876]">{user.email || "-"}</td>
                    {shouldRenderPlatformRole ? (
                      <td className="px-4 py-3 text-sm text-[#003F60]">{user.platformRole || "-"}</td>
                    ) : null}
                    <td className="px-4 py-3 text-sm text-[#2b5876]">
                      {user.membershipRoles.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {user.membershipRoles.map((role) => {
                            const config = roleBadgeConfig[role as BadgeTone];
                            const Icon = config?.icon;
                            const label = roleLabels[role as keyof typeof roleLabels] || role;

                            if (!Icon) {
                              return <span key={role}>{label}</span>;
                            }

                            return (
                              <div
                                key={role}
                                className="group relative inline-flex"
                                title={label}
                              >
                                <Icon className={`h-5 w-5 cursor-help ${config.bgColor} p-1 rounded`} />
                                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded bg-[#003F60] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 whitespace-nowrap z-10">
                                  {label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2b5876]">
                      {user.hasPendingAuthorization ? (
                        <button
                          type="button"
                          onClick={() => openAuthorizeModal(user)}
                          className="inline-flex items-center rounded-full bg-[#fa4361] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.6px] text-white hover:bg-[#e63450]"
                        >
                          {pendingStatusLabel}
                        </button>
                      ) : user.isActive ? (
                        statusActiveLabel
                      ) : (
                        statusInactiveLabel
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedPendingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#003F60]/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
            <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-xl font-bold text-[#003F60]">
              {authorizeModalTitle}
            </h2>

            <div className="mt-4 space-y-3 text-sm text-[#2b5876]">
              <p>
                <span className="font-semibold text-[#003F60]">{authorizeModalUserLabel}: </span>
                {selectedPendingUser.fullName || "-"}
              </p>
              <p>
                <span className="font-semibold text-[#003F60]">{authorizeModalEmailLabel}: </span>
                {selectedPendingUser.email || "-"}
              </p>
              <label className="block">
                <span className="block font-semibold text-[#003F60]" id="authorize-role-label">{authorizeModalRoleLabel}</span>
                <select
                  id="authorize-role-select"
                  aria-labelledby="authorize-role-label"
                  value={assignedRole}
                  onChange={(event) =>
                    setAssignedRole(
                      event.target.value as
                        | "school_owner"
                        | "direction"
                        | "coordination"
                        | "teacher"
                        | "clerk"
                        | "parent"
                        | "student"
                        | "guest"
                    )
                  }
                  disabled={isAuthorizing}
                  className="mt-2 w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60]"
                >
                  {roleAssignOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {authorizeError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#b51d3a]">{authorizeError}</p>
            ) : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAuthorizeModal}
                disabled={isAuthorizing}
                className="rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-60"
              >
                {authorizeModalCancelLabel}
              </button>
              <button
                type="button"
                onClick={authorizePendingUser}
                disabled={isAuthorizing}
                className="rounded-lg bg-[#36e7e1] px-4 py-2 text-sm font-semibold text-[#003F60] hover:bg-[#23d2cc] disabled:opacity-60"
              >
                {isAuthorizing ? authorizeModalSubmittingLabel : authorizeModalConfirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedProfileUser ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#003F60]/40 p-4"
          onClick={closeProfileModal}
        >
          <div
            className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-xl font-bold text-[#003F60]">
                {profileModalTitle}
              </h2>
              <button
                type="button"
                onClick={closeProfileModal}
                disabled={isSavingProfile}
                aria-label={profileModalCancel}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d6e8f6] text-[#2b5876] hover:bg-[#f5fbff] disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {isProfileDetailsLoading ? (
                <p className="text-sm text-[#2b5876]">{loadingLabel}</p>
              ) : null}

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalFullName}</span>
                <input
                  type="text"
                  value={profileFormData.fullName}
                  onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                  disabled={isSavingProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                />
              </label>

              <div className="rounded-lg bg-[#f5fbff] px-3 py-2">
                <p className="text-xs font-medium text-[#2b5876]">{profileModalEmail}</p>
                <p className="text-sm text-[#003F60]">{selectedProfileUser.email || "-"}</p>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalPhone}</span>
                <input
                  type="tel"
                  value={profileFormData.phone}
                  onChange={(e) => setProfileFormData({ ...profileFormData, phone: e.target.value })}
                  disabled={isSavingProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalDateOfBirth}</span>
                <input
                  type="date"
                  value={profileFormData.dateOfBirth}
                  onChange={(e) => setProfileFormData({ ...profileFormData, dateOfBirth: e.target.value })}
                  disabled={isSavingProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalLanguage}</span>
                <select
                  value={profileFormData.preferredLocale}
                  onChange={(e) => setProfileFormData({ ...profileFormData, preferredLocale: e.target.value })}
                  disabled={isSavingProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                >
                  <option value="en-US">English</option>
                  <option value="es-MX">Español</option>
                </select>
              </label>

              {profileDetails ? (
                <div className="grid gap-3 rounded-lg border border-[#e4eef7] bg-[#f5fbff] p-3 sm:grid-cols-2">
                  {profileDetails.profile.platformRole ? (
                    <div>
                      <p className="text-xs font-medium text-[#2b5876]">{platformRoleColumnLabel}</p>
                      <p className="text-sm text-[#003F60]">{profileDetails.profile.platformRole}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{statusColumnLabel}</p>
                    <p className="text-sm text-[#003F60]">
                      {Array.from(new Set(profileDetails.memberships.map((membership) => membership.approvalStatus)))
                        .map((status) => approvalStatusLabels[status] || status)
                        .join(", ") || "-"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-[#2b5876]">{membershipRoleEditLabel || authorizeModalRoleLabel}</p>
                      {!isEditingMembershipRole ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingMembershipRole(true)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d6e8f6] text-[#2b5876] hover:bg-white"
                          aria-label={membershipRoleEditLabel || authorizeModalRoleLabel}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>

                    {isEditingMembershipRole ? (
                      <>
                        <select
                          value={membershipRoleValue}
                          onChange={(event) =>
                            setMembershipRoleValue(
                              event.target.value as
                                | "school_owner"
                                | "direction"
                                | "coordination"
                                | "teacher"
                                | "clerk"
                                | "parent"
                                | "student"
                                | "guest"
                            )
                          }
                          disabled={isSavingMembershipRole}
                          className="mt-1 w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                        >
                          {roleAssignOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingMembershipRole(false)}
                            disabled={isSavingMembershipRole}
                            className="rounded-lg border border-[#d6e8f6] px-3 py-1.5 text-xs font-medium text-[#003F60] hover:bg-white disabled:opacity-60"
                          >
                            {profileModalCancel}
                          </button>
                          <button
                            type="button"
                            onClick={saveMembershipRoleChanges}
                            disabled={isSavingMembershipRole}
                            className="rounded-lg bg-[#36e7e1] px-3 py-1.5 text-xs font-semibold text-[#003F60] hover:bg-[#23d2cc] disabled:opacity-60"
                          >
                            {isSavingMembershipRole
                              ? membershipRoleSavingLabel || profileModalSaving
                              : membershipRoleSaveLabel || profileModalSave}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-1 rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60]">
                        {roleAssignOptions.find((option) => option.value === membershipRoleValue)?.label || "-"}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {profileDetails?.parentProfile ? (
                <div className="grid gap-3 rounded-lg border border-[#e4eef7] bg-[#f5fbff] p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalCurp}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.parentProfile.curp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalRfc}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.parentProfile.rfc || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalProfession}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.parentProfile.profession || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalInvoiceRequired}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.parentProfile.invoiceRequired ? profileModalYes : profileModalNo}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {profileError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#b51d3a]">{profileError}</p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  disabled={isSavingProfile}
                  className="rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-60"
                >
                  {profileModalCancel}
                </button>
                <button
                  type="button"
                  onClick={saveProfileChanges}
                  disabled={isSavingProfile}
                  className="rounded-lg bg-[#36e7e1] px-4 py-2 text-sm font-semibold text-[#003F60] hover:bg-[#23d2cc] disabled:opacity-60"
                >
                  {isSavingProfile ? profileModalSaving : profileModalSave}
                </button>
              </div>

              {!showDeactivateConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeactivateConfirm(true)}
                  disabled={isSavingProfile}
                  className="rounded-lg border border-[#fa4361] px-4 py-2 text-sm font-medium text-[#fa4361] hover:bg-[#fde8eb] disabled:opacity-60"
                >
                  {profileModalDeactivate}
                </button>
              ) : (
                <div className="space-y-2 rounded-lg bg-[#FFF3F5] p-3">
                  <p className="text-sm text-[#2b5876]">{profileModalDeactivateConfirm}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeactivateConfirm(false)}
                      disabled={isSavingProfile}
                      className="flex-1 rounded-lg border border-[#d6e8f6] px-3 py-1.5 text-xs font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={deactivateUser}
                      disabled={isSavingProfile}
                      className="flex-1 rounded-lg bg-[#fa4361] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#e63450] disabled:opacity-60"
                    >
                      {profileModalDeactivateButton}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
