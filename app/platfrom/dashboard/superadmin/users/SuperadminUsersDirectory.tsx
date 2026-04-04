"use client";

import { Fragment, useEffect, useMemo, useState, type ComponentType } from "react";
import {
  ShieldCheck,
  Users,
  Heart,
  Crown,
  Building2,
  BriefcaseBusiness,
  GraduationCap,
  ClipboardList,
  HeartHandshake,
  BookOpen,
  UserCircle2,
  ChevronDown,
  X,
  Pencil,
} from "lucide-react";
import {
  AppUsersDirectoryControls,
  type AppUsersDirectoryOrderFilter,
  type AppUsersDirectoryStatusFilter,
} from "@/components/ui";
import {
  SUPERADMIN_PENDING_USERS_REFRESH_EVENT,
  emitSuperadminPendingUsersRefresh,
} from "@/lib/dashboard-events";
import {
  canManageTargetRole,
  getEffectiveManagementRole,
  type ActorScope,
} from "@/lib/role-assignment-policy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface StudentDirectoryData {
  curp: string | null;
  gradeLevel: string | null;
  dateOfBirth: string | null;
  bloodType: string | null;
  allergies: string | null;
  approvalStatus: string | null;
  onboardingStatus: string | null;
  dataAuthorizationSignedAt: string | null;
  guardianProfileId: string | null;
  guardianFullName: string | null;
  guardianEmail: string | null;
}

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
  isStudentRecord?: boolean;
  studentData?: StudentDirectoryData;
  linkedStudents?: Array<{ id: string; fullName: string | null; gradeLevel: string | null }>;
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

interface ProfileStudentDetails {
  curp: string | null;
  gradeLevel: string | null;
  bloodType: string | null;
  allergies: string | null;
  enrollmentDate: string | null;
  approvalStatus: string | null;
  onboardingStatus: string | null;
  dataAuthorizationSignedAt: string | null;
}

interface ParentTransferStudent {
  id: string;
  fullName: string;
  gradeLevel: string | null;
  approvalStatus: string | null;
  guardianLinkStatus: string;
}

interface ParentTransferCandidate {
  id: string;
  fullName: string | null;
  email: string | null;
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
  studentProfile?: ProfileStudentDetails | null;
}

type BadgeTone = "superadmin" | "school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest";

const membershipRolePriority: Record<string, number> = {
  school_owner: 0,
  direction: 1,
  coordination: 2,
  teacher: 3,
  clerk: 4,
  parent: 5,
  student: 6,
  guest: 7,
};

const TRANSFER_TARGET_SEARCH_DEBOUNCE_MS = 2000;

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
    icon: Building2,
  },
  coordination: {
    bgColor: "bg-[#60A5FA]",
    lightBgColor: "bg-[#E0F2FF]",
    textColor: "text-white",
    icon: BriefcaseBusiness,
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
    bgColor: "bg-[#EC4899]",
    lightBgColor: "bg-[#FDF2FA]",
    textColor: "text-white",
    icon: HeartHandshake,
  },
  student: {
    bgColor: "bg-[#36e7e1]",
    lightBgColor: "bg-[#E0FFFE]",
    textColor: "text-[#003F60]",
    icon: BookOpen,
  },
  guest: {
    bgColor: "bg-[#E2E8F0]",
    lightBgColor: "bg-[#F8FAFC]",
    textColor: "text-[#003F60]",
    icon: UserCircle2,
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
  authorizeModalGradeLabel?: string;
  authorizeModalGuardianLabel?: string;
  linkedStudentsLabel?: string;
  linkedParentLabel?: string;
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
  profileModalPhonePlaceholder?: string;
  profileModalDateOfBirth: string;
  profileModalLanguage: string;
  profileModalCurp?: string;
  profileModalRfc?: string;
  profileModalProfession?: string;
  profileModalInvoiceRequired?: string;
  profileModalStudentGradeLevel?: string;
  profileModalStudentBloodType?: string;
  profileModalStudentAllergies?: string;
  profileModalStudentEnrollmentDate?: string;
  profileModalStudentApprovalStatus?: string;
  profileModalStudentOnboardingStatus?: string;
  profileModalStudentDataAuthorizationSignedAt?: string;
  profileModalTransferSectionTitle?: string;
  profileModalTransferTargetParentLabel?: string;
  profileModalTransferTargetParentSearchPlaceholder?: string;
  profileModalTransferTargetParentNoMatchesLabel?: string;
  profileModalTransferTargetParentSameAccountLabel?: string;
  profileModalTransferTargetParentSearchingLabel?: string;
  profileModalTransferTargetParentResolvedLabel?: string;
  profileModalTransferTargetParentRefineLabel?: string;
  profileModalTransferMatchesTitleLabel?: string;
  profileModalTransferMatchesParentColumnLabel?: string;
  profileModalTransferMatchesEmailColumnLabel?: string;
  profileModalTransferMatchesActionLabel?: string;
  profileModalTransferStudentsHintLabel?: string;
  profileModalTransferStudentsLabel?: string;
  profileModalTransferContactCurrentParentLabel?: string;
  profileModalTransferContactTargetParentLabel?: string;
  profileModalTransferNotesLabel?: string;
  profileModalTransferCreateRequestLabel?: string;
  profileModalTransferCreatingRequestLabel?: string;
  profileModalTransferConfirmPhraseLabel?: string;
  profileModalTransferConfirmButtonLabel?: string;
  profileModalTransferConfirmingButtonLabel?: string;
  profileModalTransferEmptyStudentsLabel?: string;
  profileModalTransferEmptyCandidatesLabel?: string;
  profileModalTransferRequestCreatedLabel?: string;
  profileModalTransferSuccessLabel?: string;
  profileModalTransferErrorLabel?: string;
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
  profileModalActivate?: string;
  profileModalActivateConfirm?: string;
  profileModalActivateButton?: string;
  profileModalError: string;
  statusApprovedLabel?: string;
  statusRejectedLabel?: string;
  statusSuspendedLabel?: string;
  usersDirectoryApiPath?: string;
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
  authorizeModalGradeLabel,
  authorizeModalGuardianLabel,
  linkedStudentsLabel = "Students",
  linkedParentLabel = "Parent / Guardian",
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
  profileModalPhonePlaceholder,
  profileModalDateOfBirth,
  profileModalLanguage,
  profileModalCurp,
  profileModalRfc,
  profileModalProfession,
  profileModalInvoiceRequired,
  profileModalStudentGradeLevel,
  profileModalStudentBloodType,
  profileModalStudentAllergies,
  profileModalStudentEnrollmentDate,
  profileModalStudentApprovalStatus,
  profileModalStudentOnboardingStatus,
  profileModalStudentDataAuthorizationSignedAt,
  profileModalTransferSectionTitle,
  profileModalTransferTargetParentLabel,
  profileModalTransferTargetParentSearchPlaceholder,
  profileModalTransferTargetParentNoMatchesLabel,
  profileModalTransferTargetParentSameAccountLabel,
  profileModalTransferTargetParentSearchingLabel,
  profileModalTransferTargetParentResolvedLabel,
  profileModalTransferTargetParentRefineLabel,
  profileModalTransferMatchesTitleLabel,
  profileModalTransferMatchesParentColumnLabel,
  profileModalTransferMatchesEmailColumnLabel,
  profileModalTransferMatchesActionLabel,
  profileModalTransferStudentsHintLabel,
  profileModalTransferStudentsLabel,
  profileModalTransferContactCurrentParentLabel,
  profileModalTransferContactTargetParentLabel,
  profileModalTransferNotesLabel,
  profileModalTransferCreateRequestLabel,
  profileModalTransferCreatingRequestLabel,
  profileModalTransferConfirmPhraseLabel,
  profileModalTransferConfirmButtonLabel,
  profileModalTransferConfirmingButtonLabel,
  profileModalTransferEmptyStudentsLabel,
  profileModalTransferEmptyCandidatesLabel,
  profileModalTransferRequestCreatedLabel,
  profileModalTransferSuccessLabel,
  profileModalTransferErrorLabel,
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
  profileModalActivate,
  profileModalActivateConfirm,
  profileModalActivateButton,
  profileModalError,
  statusApprovedLabel,
  statusRejectedLabel,
  statusSuspendedLabel,
  usersDirectoryApiPath = "/api/admin/users-directory",
}: SuperadminUsersDirectoryProps) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [users, setUsers] = useState<UserDirectoryEntry[]>([]);
  const [actorScope, setActorScope] = useState<ActorScope>("superadmin");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

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
  const [statusFilter, setStatusFilter] = useState<AppUsersDirectoryStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState<AppUsersDirectoryOrderFilter>("newest");
  const [selectedPendingUser, setSelectedPendingUser] = useState<UserDirectoryEntry | null>(null);
  const [assignedRole, setAssignedRole] = useState<"school_owner" | "direction" | "coordination" | "teacher" | "clerk" | "parent" | "student" | "guest">("parent");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);
  const [assignableRoles, setAssignableRoles] = useState<string[]>([
    "school_owner",
    "direction",
    "coordination",
    "teacher",
    "clerk",
    "parent",
    "student",
    "guest",
  ]);

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
  const [isTransferContextLoading, setIsTransferContextLoading] = useState(false);
  const [transferStudents, setTransferStudents] = useState<ParentTransferStudent[]>([]);
  const [transferCandidateParents, setTransferCandidateParents] = useState<ParentTransferCandidate[]>([]);
  const [transferTargetParentSearch, setTransferTargetParentSearch] = useState("");
  const [debouncedTransferTargetParentSearch, setDebouncedTransferTargetParentSearch] = useState("");
  const [selectedTransferStudentIds, setSelectedTransferStudentIds] = useState<string[]>([]);
  const [selectedTransferTargetParentId, setSelectedTransferTargetParentId] = useState("");
  const [transferContactedCurrentParent, setTransferContactedCurrentParent] = useState(false);
  const [transferContactedTargetParent, setTransferContactedTargetParent] = useState(false);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferRequestId, setTransferRequestId] = useState<string | null>(null);
  const [transferConfirmPhrase, setTransferConfirmPhrase] = useState("");
  const [isCreatingTransferRequest, setIsCreatingTransferRequest] = useState(false);
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<{ tone: "error" | "success"; message: string } | null>(null);

  const transferLabels = {
    sectionTitle: profileModalTransferSectionTitle || "Transfer children to another parent",
    targetParent: profileModalTransferTargetParentLabel || "Target parent",
    targetParentSearchPlaceholder:
      profileModalTransferTargetParentSearchPlaceholder || "Search parent by name or email",
    targetParentNoMatches:
      profileModalTransferTargetParentNoMatchesLabel || "No matching parent account found.",
    targetParentSameAccount:
      profileModalTransferTargetParentSameAccountLabel || "You cannot transfer children to the same parent account.",
    targetParentSearching:
      profileModalTransferTargetParentSearchingLabel || "Searching parent account...",
    targetParentResolved:
      profileModalTransferTargetParentResolvedLabel || "Selected target parent: {target}",
    targetParentRefine:
      profileModalTransferTargetParentRefineLabel || "Found multiple matches ({count}). Type full email to select one.",
    matchesTitle: profileModalTransferMatchesTitleLabel || "Matching parent accounts",
    matchesParentColumn: profileModalTransferMatchesParentColumnLabel || "Parent",
    matchesEmailColumn: profileModalTransferMatchesEmailColumnLabel || "Email",
    matchesAction: profileModalTransferMatchesActionLabel || "Transfer selected children",
    students: profileModalTransferStudentsLabel || "Children to transfer",
    studentsHint: profileModalTransferStudentsHintLabel || "Select one or more children to transfer.",
    contactCurrentParent: profileModalTransferContactCurrentParentLabel || "Current parent contacted",
    contactTargetParent: profileModalTransferContactTargetParentLabel || "Target parent contacted",
    notes: profileModalTransferNotesLabel || "Communication notes",
    createRequest: profileModalTransferCreateRequestLabel || "Create transfer request",
    creatingRequest: profileModalTransferCreatingRequestLabel || "Creating request...",
    confirmPhrase: profileModalTransferConfirmPhraseLabel || "Type TRANSFER to confirm",
    confirmButton: profileModalTransferConfirmButtonLabel || "Confirm transfer",
    confirmingButton: profileModalTransferConfirmingButtonLabel || "Confirming transfer...",
    emptyStudents: profileModalTransferEmptyStudentsLabel || "No linked children found for this parent.",
    emptyCandidates: profileModalTransferEmptyCandidatesLabel || "No candidate parent accounts available.",
    requestCreated: profileModalTransferRequestCreatedLabel || "Transfer request created. Confirm to execute.",
    success: profileModalTransferSuccessLabel || "Children were transferred successfully.",
    error: profileModalTransferErrorLabel || "Could not process transfer request. Please try again.",
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTransferTargetParentSearch(transferTargetParentSearch);
    }, TRANSFER_TARGET_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [transferTargetParentSearch]);

  const filteredTransferCandidateParents = useMemo(() => {
    const query = debouncedTransferTargetParentSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return transferCandidateParents.filter((candidate) => {
      const fullName = candidate.fullName?.toLowerCase() || "";
      const email = candidate.email?.toLowerCase() || "";
      return fullName.includes(query) || email.includes(query);
    });
  }, [debouncedTransferTargetParentSearch, transferCandidateParents]);

  const resolvedTransferTargetParent = useMemo(() => {
    const query = debouncedTransferTargetParentSearch.trim().toLowerCase();
    if (!query) {
      return null;
    }

    const exactMatches = filteredTransferCandidateParents.filter((candidate) => {
      const fullName = candidate.fullName?.trim().toLowerCase() || "";
      const email = candidate.email?.trim().toLowerCase() || "";
      return fullName === query || email === query;
    });

    if (exactMatches.length === 1) {
      return exactMatches[0];
    }

    if (exactMatches.length === 0 && filteredTransferCandidateParents.length === 1) {
      return filteredTransferCandidateParents[0];
    }

    return null;
  }, [debouncedTransferTargetParentSearch, filteredTransferCandidateParents]);

  const transferTargetSearchStatus = useMemo(() => {
    const rawQuery = transferTargetParentSearch.trim();
    if (!rawQuery) {
      return null;
    }

    const isDebouncing = rawQuery !== debouncedTransferTargetParentSearch.trim();
    if (isDebouncing) {
      return transferLabels.targetParentSearching;
    }

    const query = debouncedTransferTargetParentSearch.trim().toLowerCase();
    const sourceParentName =
      profileDetails?.profile.fullName?.trim().toLowerCase() ||
      selectedProfileUser?.fullName?.trim().toLowerCase() ||
      "";
    const sourceParentEmail =
      profileDetails?.profile.email?.trim().toLowerCase() ||
      selectedProfileUser?.email?.trim().toLowerCase() ||
      "";

    const matchesSourceParent =
      query.length > 0 &&
      ((sourceParentName.length > 0 && sourceParentName.includes(query)) ||
        (sourceParentEmail.length > 0 && sourceParentEmail.includes(query)));

    if (matchesSourceParent && filteredTransferCandidateParents.length === 0) {
      return transferLabels.targetParentSameAccount;
    }

    if (filteredTransferCandidateParents.length === 0) {
      return transferLabels.targetParentNoMatches;
    }

    if (resolvedTransferTargetParent) {
      const resolvedLabel =
        resolvedTransferTargetParent.fullName ||
        resolvedTransferTargetParent.email ||
        resolvedTransferTargetParent.id;

      return transferLabels.targetParentResolved.replace("{target}", resolvedLabel);
    }

    return transferLabels.targetParentRefine.replace(
      "{count}",
      String(filteredTransferCandidateParents.length)
    );
  }, [
    debouncedTransferTargetParentSearch,
    filteredTransferCandidateParents,
    resolvedTransferTargetParent,
    transferLabels.targetParentNoMatches,
    transferLabels.targetParentRefine,
    transferLabels.targetParentResolved,
    transferLabels.targetParentSameAccount,
    transferLabels.targetParentSearching,
    profileDetails?.profile.email,
    profileDetails?.profile.fullName,
    selectedProfileUser?.email,
    selectedProfileUser?.fullName,
    transferTargetParentSearch,
  ]);

  useEffect(() => {
    setSelectedTransferTargetParentId(resolvedTransferTargetParent?.id || "");
  }, [resolvedTransferTargetParent]);

  const approvalStatusLabels = useMemo(
    () => ({
      pending: pendingStatusLabel,
      approved: statusApprovedLabel,
      rejected: statusRejectedLabel,
      suspended: statusSuspendedLabel,
    }),
    [pendingStatusLabel, statusApprovedLabel, statusRejectedLabel, statusSuspendedLabel]
  );

  const isProfileFormBusy = isSavingProfile || isProfileDetailsLoading;

  useEffect(() => {
    let isCancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let activeRequestId = 0;

    const fetchUsers = async () => {
      activeRequestId += 1;
      const requestId = activeRequestId;

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

      if (!sessionToken || requestId !== activeRequestId) {
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      const response = await fetch(usersDirectoryApiPath, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        if (!isCancelled && requestId === activeRequestId) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      const payload = (await response.json()) as {
        ok: boolean;
        users?: UserDirectoryEntry[];
        assignableRoles?: string[];
        actorScope?: ActorScope;
      };
      if (!payload.ok || !payload.users) {
        if (!isCancelled && requestId === activeRequestId) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      if (!isCancelled && requestId === activeRequestId) {
        setUsers(payload.users);
        if (payload.actorScope) {
          setActorScope(payload.actorScope);
        }
        if (Array.isArray(payload.assignableRoles) && payload.assignableRoles.length > 0) {
          setAssignableRoles(payload.assignableRoles);
          setAssignedRole((previousRole) => {
            if (payload.assignableRoles?.includes(previousRole)) {
              return previousRole;
            }

            const fallbackRole = payload.assignableRoles?.[0];
            return (fallbackRole as typeof previousRole) || previousRole;
          });
        }
        setIsLoading(false);
      }
    };

    const handlePendingUsersRefresh = (event: Event) => {
      const customEvent = event as CustomEvent<{ source?: string }>;
      if (customEvent.detail?.source === "users-directory") {
        return;
      }

      void fetchUsers();
    };

    void fetchUsers();

    window.addEventListener(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, handlePendingUsersRefresh as EventListener);

    return () => {
      isCancelled = true;
      activeRequestId += 1;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      window.removeEventListener(SUPERADMIN_PENDING_USERS_REFRESH_EVENT, handlePendingUsersRefresh as EventListener);
    };
  }, [supabase, usersDirectoryApiPath]);

  useEffect(() => {
    emitSuperadminPendingUsersRefresh("users-directory");
  }, [users]);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>(assignableRoles);
    users.forEach((user) => {
      if (user.platformRole && user.platformRole !== "superadmin") {
        uniqueRoles.add(user.platformRole);
      }
      user.membershipRoles.forEach((role) => uniqueRoles.add(role));
    });

    return Array.from(uniqueRoles).sort((leftRole, rightRole) => {
      const leftPriority = membershipRolePriority[leftRole] ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = membershipRolePriority[rightRole] ?? Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return leftRole.localeCompare(rightRole);
    });
  }, [assignableRoles, users]);

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

  const selectedProfileEffectiveRole = useMemo(
    () =>
      getEffectiveManagementRole({
        platformRole: profileDetails?.profile.platformRole ?? selectedProfileUser?.platformRole ?? null,
        memberships: profileDetails?.memberships,
        membershipRoles: selectedProfileUser?.membershipRoles,
      }),
    [
      profileDetails?.memberships,
      profileDetails?.profile.platformRole,
      selectedProfileUser?.membershipRoles,
      selectedProfileUser?.platformRole,
    ]
  );

  const canManageSelectedProfile = useMemo(
    () => canManageTargetRole(actorScope, selectedProfileEffectiveRole),
    [actorScope, selectedProfileEffectiveRole]
  );

  const allRoleOptions = useMemo(
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

  const roleAssignOptions = useMemo(
    () => allRoleOptions.filter((roleOption) => assignableRoles.includes(roleOption.value)),
    [allRoleOptions, assignableRoles]
  );

  const openAuthorizeModal = (user: UserDirectoryEntry) => {
    setSelectedPendingUser(user);
    const fallbackRole = roleAssignOptions.find((role) => role.value === "parent")?.value || roleAssignOptions[0]?.value || "parent";
    setAssignedRole(fallbackRole as typeof assignedRole);
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

      // Student records are approved via a dedicated student endpoint (no school membership)
      if (selectedPendingUser.isStudentRecord) {
        const response = await fetch(`/api/admin/students/${selectedPendingUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "approve" }),
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
              studentData: user.studentData
                ? { ...user.studentData, approvalStatus: "approved", onboardingStatus: "active" }
                : user.studentData,
            };
          })
        );

        setSelectedPendingUser(null);
        return;
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
      dateOfBirth: user.studentData?.dateOfBirth || "",
      preferredLocale: user.preferredLocale || "",
    });
    setProfileError(null);
    setShowDeactivateConfirm(false);
    setIsEditingMembershipRole(false);
    setTransferFeedback(null);
    setTransferRequestId(null);
    setTransferConfirmPhrase("");
    setTransferStudents([]);
    setTransferCandidateParents([]);
    setTransferTargetParentSearch("");
    setSelectedTransferStudentIds([]);
    setSelectedTransferTargetParentId("");
    setTransferContactedCurrentParent(false);
    setTransferContactedTargetParent(false);
    setTransferNotes("");

    // Student records have no auth profile — populate inline from directory data
    if (user.isStudentRecord) {
      const sd = user.studentData;
      setProfileDetails({
        profile: {
          id: user.id,
          fullName: user.fullName,
          email: null,
          phone: null,
          dateOfBirth: sd?.dateOfBirth ?? null,
          preferredLocale: user.preferredLocale,
          platformRole: null,
          isActive: user.isActive,
        },
        memberships: [],
        parentProfile: null,
        studentProfile: sd
          ? {
              curp: sd.curp,
              gradeLevel: sd.gradeLevel,
              bloodType: sd.bloodType,
              allergies: sd.allergies,
              enrollmentDate: null,
              approvalStatus: sd.approvalStatus,
              onboardingStatus: sd.onboardingStatus,
              dataAuthorizationSignedAt: sd.dataAuthorizationSignedAt,
            }
          : null,
      });
      setIsProfileDetailsLoading(false);
      return;
    }

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
        studentProfile?: ProfileStudentDetails | null;
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
        studentProfile: payload.studentProfile,
      });

      const isParentRole = (payload.memberships || []).some(
        (membership) =>
          membership.schoolRole === "parent" &&
          membership.isActive &&
          membership.approvalStatus === "approved"
      );
      if (isParentRole) {
        setIsTransferContextLoading(true);
        const transferResponse = await fetch(
          `/api/admin/parent-child-transfer?sourceParentProfileId=${encodeURIComponent(user.id)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (transferResponse.ok) {
          const transferPayload = (await transferResponse.json()) as {
            ok: boolean;
            linkedStudents?: ParentTransferStudent[];
            candidateParents?: ParentTransferCandidate[];
          };

          if (transferPayload.ok) {
            setTransferStudents(transferPayload.linkedStudents || []);
            setSelectedTransferStudentIds([]);
            setTransferCandidateParents(transferPayload.candidateParents || []);
          }
        }

        setIsTransferContextLoading(false);
      }

      const sortMembershipsByPriority = (memberships: ProfileMembership[]) =>
        memberships.sort((left, right) => {
          const leftPriority = membershipRolePriority[left.schoolRole] ?? Number.MAX_SAFE_INTEGER;
          const rightPriority = membershipRolePriority[right.schoolRole] ?? Number.MAX_SAFE_INTEGER;
          return leftPriority - rightPriority;
        });

      const activeApprovedMemberships = (payload.memberships || [])
        .filter((membership) => membership.isActive && membership.approvalStatus === "approved")
        .sort(sortMembershipsByPriority);

      // Fallback: if no active+approved, get highest-priority membership regardless of status
      const allMembershipsSorted = (payload.memberships || []).sort(sortMembershipsByPriority);
      const primaryMembership = activeApprovedMemberships[0] ?? allMembershipsSorted[0] ?? null;

      if (primaryMembership) {
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
    setTransferFeedback(null);
    setTransferRequestId(null);
    setTransferConfirmPhrase("");
    setTransferTargetParentSearch("");
  };

  const createTransferRequest = async (targetParentProfileId?: string) => {
    const resolvedTargetParentId = targetParentProfileId || selectedTransferTargetParentId;
    if (!selectedProfileUser || !resolvedTargetParentId || selectedTransferStudentIds.length === 0) {
      setTransferFeedback({ tone: "error", message: transferLabels.error });
      return;
    }

    setSelectedTransferTargetParentId(resolvedTargetParentId);

    setIsCreatingTransferRequest(true);
    setTransferFeedback(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(transferLabels.error);
      }

      const response = await fetch("/api/admin/parent-child-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "request",
          sourceParentProfileId: selectedProfileUser.id,
          targetParentProfileId: resolvedTargetParentId,
          studentIds: selectedTransferStudentIds,
          contactedCurrentParent: transferContactedCurrentParent,
          contactedTargetParent: transferContactedTargetParent,
          communicationNotes: transferNotes,
        }),
      });

      const payload = (await response.json()) as { ok: boolean; transferRequestId?: string; reason?: string };
      if (!response.ok || !payload.ok || !payload.transferRequestId) {
        throw new Error(payload.reason || transferLabels.error);
      }

      setTransferRequestId(payload.transferRequestId);
      setTransferFeedback({ tone: "success", message: transferLabels.requestCreated });
    } catch (error) {
      setTransferFeedback({ tone: "error", message: error instanceof Error ? error.message : transferLabels.error });
    } finally {
      setIsCreatingTransferRequest(false);
    }
  };

  const confirmTransferRequest = async () => {
    if (!transferRequestId) {
      return;
    }

    setIsConfirmingTransfer(true);
    setTransferFeedback(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(transferLabels.error);
      }

      const response = await fetch("/api/admin/parent-child-transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "confirm",
          transferRequestId,
          confirmPhrase: transferConfirmPhrase,
        }),
      });

      const payload = (await response.json()) as { ok: boolean; reason?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.reason || transferLabels.error);
      }

      setTransferFeedback({ tone: "success", message: transferLabels.success });
      setTransferRequestId(null);
      setTransferConfirmPhrase("");
    } catch (error) {
      setTransferFeedback({ tone: "error", message: error instanceof Error ? error.message : transferLabels.error });
    } finally {
      setIsConfirmingTransfer(false);
    }
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
        studentProfile?: ProfileStudentDetails | null;
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
          studentProfile: payload.studentProfile ?? previous.studentProfile,
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

      if (selectedProfileUser.isStudentRecord) {
        const action = selectedProfileUser.isActive ? "reject" : "approve";
        const response = await fetch(`/api/admin/students/${selectedProfileUser.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.reason || profileModalError);
        }
      } else {
        const response = await fetch("/api/admin/user-profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            profileId: selectedProfileUser.id,
            isActive: !selectedProfileUser.isActive,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.error || profileModalError);
        }
      }

      const newIsActive = !selectedProfileUser.isActive;
      setUsers((previousUsers) =>
        previousUsers.map((user) => {
          if (user.id !== selectedProfileUser.id) {
            return user;
          }

          return {
            ...user,
            isActive: newIsActive,
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
        <AppUsersDirectoryControls
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          searchPlaceholder={searchPlaceholder}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statusAllLabel={statusAllLabel}
          statusActiveLabel={statusActiveLabel}
          statusInactiveLabel={statusInactiveLabel}
          roleFilterLabel={roleFilterLabel}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          roleAllLabel={roleAllLabel}
          roleOptions={roleOptions}
          roleValueLabels={roleLabels}
          orderFilter={orderFilter}
          onOrderFilterChange={setOrderFilter}
          orderNewestLabel={orderNewestLabel}
          orderOldestLabel={orderOldestLabel}
          orderNameLabel={orderNameLabel}
        />
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

                return (() => {
                  const isParentRow = user.membershipRoles.includes("parent");
                  const isStudentRow = user.isStudentRecord === true;
                  const hasLinkedItems =
                    (isParentRow && (user.linkedStudents?.length ?? 0) > 0) ||
                    (isStudentRow && !!user.studentData?.guardianProfileId);
                  const isExpanded = expandedRowId === user.id;
                  const colCount = shouldRenderPlatformRole ? 5 : 4;

                  return (
                    <Fragment key={user.id}>
                      <tr className={`border-t border-[#eef4fa] ${rowBgColor}`}>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() => openProfileModal(user)}
                            className="text-[#003F60] hover:text-[#36e7e1] hover:underline font-medium text-left"
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
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {user.hasPendingAuthorization ? (
                              <button
                                type="button"
                                onClick={() => openAuthorizeModal(user)}
                                className="inline-flex items-center rounded-full bg-[#fa4361] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.6px] text-white hover:bg-[#e63450]"
                              >
                                {pendingStatusLabel}
                              </button>
                            ) : user.isActive ? (
                              <span className="text-[#2b5876]">{statusActiveLabel}</span>
                            ) : (
                              <span className="text-[#2b5876]">{statusInactiveLabel}</span>
                            )}
                            {hasLinkedItems ? (
                              <button
                                type="button"
                                onClick={() => setExpandedRowId(isExpanded ? null : user.id)}
                                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-[#003F60] bg-[#003F60]/10 hover:bg-[#003F60]/20"
                                title={isParentRow ? linkedStudentsLabel : linkedParentLabel}
                              >
                                {isParentRow ? (
                                  <>
                                    <BookOpen className="h-3 w-3" />
                                    <span>{user.linkedStudents!.length}</span>
                                  </>
                                ) : (
                                  <HeartHandshake className="h-3 w-3" />
                                )}
                                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && hasLinkedItems ? (
                        <tr className={rowBgColor}>
                          <td colSpan={colCount} className="px-6 pb-4 pt-0">
                            {isParentRow ? (
                              <div className="rounded-lg border border-[#d6e8f6] bg-white/60 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#003F60]">
                                  {linkedStudentsLabel}
                                </p>
                                <ul className="space-y-1">
                                  {user.linkedStudents!.map((s) => {
                                    const studentEntry = users.find((u) => u.id === s.id);
                                    return (
                                      <li key={s.id}>
                                        <button
                                          type="button"
                                          onClick={() => { if (studentEntry) openProfileModal(studentEntry); }}
                                          className="text-sm text-[#003F60] hover:text-[#36e7e1] hover:underline"
                                        >
                                          {s.fullName || "-"}
                                          {s.gradeLevel ? (
                                            <span className="ml-2 text-xs text-[#2b5876]">({s.gradeLevel})</span>
                                          ) : null}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-[#d6e8f6] bg-white/60 p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#003F60]">
                                  {linkedParentLabel}
                                </p>
                                {user.studentData?.guardianProfileId ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const parentEntry = users.find((u) => u.id === user.studentData!.guardianProfileId);
                                      if (parentEntry) openProfileModal(parentEntry);
                                    }}
                                    className="text-sm text-[#003F60] hover:text-[#36e7e1] hover:underline"
                                  >
                                    {user.studentData.guardianFullName || "-"}
                                    {user.studentData.guardianEmail ? (
                                      <span className="ml-2 text-xs text-[#2b5876]">({user.studentData.guardianEmail})</span>
                                    ) : null}
                                  </button>
                                ) : "-"}
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })();
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
              {selectedPendingUser.isStudentRecord ? (
                <>
                  <p>
                    <span className="font-semibold text-[#003F60]">{authorizeModalGradeLabel || "Grade"}: </span>
                    {selectedPendingUser.studentData?.gradeLevel || "-"}
                  </p>
                  <p>
                    <span className="font-semibold text-[#003F60]">{authorizeModalGuardianLabel || "Parent / Guardian"}: </span>
                    {selectedPendingUser.studentData?.guardianFullName || "-"}
                    {selectedPendingUser.studentData?.guardianEmail ? ` (${selectedPendingUser.studentData.guardianEmail})` : ""}
                  </p>
                </>
              ) : null}
              {!selectedPendingUser.isStudentRecord ? (
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
              ) : null}
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

            <div className="mt-4 space-y-3" aria-busy={isProfileDetailsLoading}>
              {isProfileDetailsLoading ? (
                <div className="flex items-center gap-3 rounded-lg border border-[#e4eef7] bg-[#f5fbff] px-3 py-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d6e8f6] border-t-[#fa4361]" />
                  <p className="text-sm text-[#2b5876]">{loadingLabel}</p>
                </div>
              ) : null}

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalFullName}</span>
                <input
                  type="text"
                  value={profileFormData.fullName}
                  onChange={(e) => setProfileFormData({ ...profileFormData, fullName: e.target.value })}
                  disabled={isProfileFormBusy || !canManageSelectedProfile}
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
                  placeholder={profileModalPhonePlaceholder}
                  disabled={isProfileFormBusy || !canManageSelectedProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalDateOfBirth}</span>
                <input
                  type="date"
                  value={profileFormData.dateOfBirth}
                  onChange={(e) => setProfileFormData({ ...profileFormData, dateOfBirth: e.target.value })}
                  disabled={isProfileFormBusy || !canManageSelectedProfile}
                  className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#003F60]">{profileModalLanguage}</span>
                <select
                  value={profileFormData.preferredLocale}
                  onChange={(e) => setProfileFormData({ ...profileFormData, preferredLocale: e.target.value })}
                  disabled={isProfileFormBusy || !canManageSelectedProfile}
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
                      {!isEditingMembershipRole && canManageSelectedProfile ? (
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
                          disabled={isSavingMembershipRole || !canManageSelectedProfile}
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
                            disabled={isSavingMembershipRole || !canManageSelectedProfile}
                            className="rounded-lg border border-[#d6e8f6] px-3 py-1.5 text-xs font-medium text-[#003F60] hover:bg-white disabled:opacity-60"
                          >
                            {profileModalCancel}
                          </button>
                          <button
                            type="button"
                            onClick={saveMembershipRoleChanges}
                            disabled={isSavingMembershipRole || !canManageSelectedProfile}
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
                        {allRoleOptions.find((option) => option.value === membershipRoleValue)?.label || "-"}
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

              {profileDetails?.studentProfile ? (
                <div className="grid gap-3 rounded-lg border border-[#e4eef7] bg-[#f5fbff] p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalCurp}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.curp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentGradeLevel}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.gradeLevel || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentBloodType}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.bloodType || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentAllergies}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.allergies || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentEnrollmentDate}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.enrollmentDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentApprovalStatus}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.approvalStatus || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentOnboardingStatus}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.onboardingStatus || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#2b5876]">{profileModalStudentDataAuthorizationSignedAt}</p>
                    <p className="text-sm text-[#003F60]">{profileDetails.studentProfile.dataAuthorizationSignedAt || "-"}</p>
                  </div>
                  {selectedProfileUser?.isStudentRecord && selectedProfileUser.studentData?.guardianFullName ? (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-[#2b5876]">{profileModalTransferContactCurrentParentLabel || "Guardian"}</p>
                      <p className="text-sm text-[#003F60]">
                        {selectedProfileUser.studentData.guardianFullName}
                        {selectedProfileUser.studentData.guardianEmail ? ` — ${selectedProfileUser.studentData.guardianEmail}` : ""}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {profileDetails?.memberships.some((membership) => membership.schoolRole === "parent") && transferStudents.length > 0 ? (
                <div className="space-y-3 rounded-lg border border-[#e4eef7] bg-[#f5fbff] p-3">
                  <h3 className="font-['Sora',Helvetica,Arial,sans-serif] text-sm font-bold text-[#003F60]">
                    {transferLabels.sectionTitle}
                  </h3>

                  {isTransferContextLoading ? (
                    <p className="text-sm text-[#2b5876]">{loadingLabel}</p>
                  ) : (
                    <>
                      <label className="block">
                        <span className="text-xs font-medium text-[#2b5876]">{transferLabels.targetParent}</span>
                        <input
                          type="search"
                          value={transferTargetParentSearch}
                          onChange={(event) => {
                            setTransferTargetParentSearch(event.target.value);
                            setSelectedTransferTargetParentId("");
                          }}
                          placeholder={transferLabels.targetParentSearchPlaceholder}
                          aria-label={transferLabels.targetParent}
                          disabled={isCreatingTransferRequest || isConfirmingTransfer || Boolean(transferRequestId)}
                          className="mt-1 w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                        />

                        {transferTargetSearchStatus ? (
                          <p className="mt-2 text-xs text-[#2b5876]">{transferTargetSearchStatus}</p>
                        ) : null}
                      </label>

                      {debouncedTransferTargetParentSearch.trim().length > 0 && filteredTransferCandidateParents.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-[#2b5876]">{transferLabels.matchesTitle}</p>
                          <div className="overflow-x-auto rounded-lg border border-[#d6e8f6] bg-white">
                            <table className="min-w-full text-sm">
                              <thead className="bg-[#f5fbff] text-left text-xs text-[#2b5876]">
                                <tr>
                                  <th className="px-3 py-2 font-semibold">{transferLabels.matchesParentColumn}</th>
                                  <th className="px-3 py-2 font-semibold">{transferLabels.matchesEmailColumn}</th>
                                  <th className="px-3 py-2 font-semibold" />
                                </tr>
                              </thead>
                              <tbody>
                                {filteredTransferCandidateParents.slice(0, 20).map((candidate) => {
                                  const candidateLabel = candidate.fullName || candidate.email || candidate.id;
                                  return (
                                    <tr key={candidate.id} className="border-t border-[#eef4fa]">
                                      <td className="px-3 py-2 text-[#003F60]">{candidateLabel}</td>
                                      <td className="px-3 py-2 text-[#2b5876]">{candidate.email || "-"}</td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() => void createTransferRequest(candidate.id)}
                                          disabled={
                                            isCreatingTransferRequest ||
                                            isConfirmingTransfer ||
                                            Boolean(transferRequestId) ||
                                            selectedTransferStudentIds.length === 0
                                          }
                                          className="rounded-lg bg-[#36e7e1] px-3 py-1.5 text-xs font-semibold text-[#003F60] disabled:opacity-60"
                                        >
                                          {isCreatingTransferRequest ? transferLabels.creatingRequest : transferLabels.matchesAction}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : null}

                      {transferCandidateParents.length === 0 ? (
                        <p className="text-xs text-[#2b5876]">{transferLabels.emptyCandidates}</p>
                      ) : null}

                      <div>
                        <p className="text-xs font-medium text-[#2b5876]">{transferLabels.students}</p>
                        <p className="mt-1 text-xs text-[#2b5876]">{transferLabels.studentsHint}</p>
                        <div className="mt-1 space-y-1">
                          {transferStudents.map((student) => (
                            <label key={student.id} className="flex items-start gap-2 rounded bg-white px-2 py-1.5 text-sm text-[#003F60]">
                              <input
                                type="checkbox"
                                checked={selectedTransferStudentIds.includes(student.id)}
                                onChange={(event) => {
                                  setSelectedTransferStudentIds((previous) => {
                                    if (event.target.checked) {
                                      return Array.from(new Set([...previous, student.id]));
                                    }

                                    return previous.filter((id) => id !== student.id);
                                  });
                                }}
                                disabled={isCreatingTransferRequest || isConfirmingTransfer || Boolean(transferRequestId)}
                                className="mt-0.5"
                              />
                              <span>
                                {student.fullName}
                                {student.gradeLevel ? ` (${student.gradeLevel})` : ""}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 rounded bg-white px-2 py-1.5 text-sm text-[#003F60]">
                          <input
                            type="checkbox"
                            checked={transferContactedCurrentParent}
                            onChange={(event) => setTransferContactedCurrentParent(event.target.checked)}
                            disabled={isCreatingTransferRequest || isConfirmingTransfer || Boolean(transferRequestId)}
                          />
                          {transferLabels.contactCurrentParent}
                        </label>
                        <label className="flex items-center gap-2 rounded bg-white px-2 py-1.5 text-sm text-[#003F60]">
                          <input
                            type="checkbox"
                            checked={transferContactedTargetParent}
                            onChange={(event) => setTransferContactedTargetParent(event.target.checked)}
                            disabled={isCreatingTransferRequest || isConfirmingTransfer || Boolean(transferRequestId)}
                          />
                          {transferLabels.contactTargetParent}
                        </label>
                      </div>

                      <label className="block">
                        <span className="text-xs font-medium text-[#2b5876]">{transferLabels.notes}</span>
                        <textarea
                          value={transferNotes}
                          onChange={(event) => setTransferNotes(event.target.value)}
                          disabled={isCreatingTransferRequest || isConfirmingTransfer || Boolean(transferRequestId)}
                          className="mt-1 min-h-[70px] w-full rounded-lg border border-[#d6e8f6] bg-white px-3 py-2 text-sm text-[#003F60] disabled:bg-[#f5fbff]"
                        />
                      </label>

                      {!transferRequestId ? (
                        <button
                          type="button"
                          onClick={() => void createTransferRequest()}
                          disabled={
                            isCreatingTransferRequest ||
                            selectedTransferStudentIds.length === 0 ||
                            !selectedTransferTargetParentId
                          }
                          className="rounded-lg bg-[#36e7e1] px-3 py-2 text-sm font-semibold text-[#003F60] disabled:opacity-60"
                        >
                          {isCreatingTransferRequest ? transferLabels.creatingRequest : transferLabels.createRequest}
                        </button>
                      ) : (
                        <div className="space-y-2 rounded border border-[#d6e8f6] bg-white p-2.5">
                          <label className="block">
                            <span className="text-xs font-medium text-[#2b5876]">{transferLabels.confirmPhrase}</span>
                            <input
                              type="text"
                              value={transferConfirmPhrase}
                              onChange={(event) => setTransferConfirmPhrase(event.target.value)}
                              disabled={isConfirmingTransfer}
                              className="mt-1 w-full rounded-lg border border-[#d6e8f6] px-3 py-2 text-sm text-[#003F60]"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={confirmTransferRequest}
                            disabled={isConfirmingTransfer || transferConfirmPhrase !== "TRANSFER"}
                            className="rounded-lg bg-[#fa4361] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {isConfirmingTransfer ? transferLabels.confirmingButton : transferLabels.confirmButton}
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {transferFeedback ? (
                    <p className={transferFeedback.tone === "error" ? "text-sm text-[#b51d3a]" : "text-sm text-[#0f5132]"}>
                      {transferFeedback.message}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {profileDetails?.memberships.some((membership) => membership.schoolRole === "parent") &&
              !isTransferContextLoading &&
              transferStudents.length === 0 ? (
                <div className="rounded-lg border border-[#e4eef7] bg-[#f5fbff] px-3 py-2">
                  <p className="text-sm text-[#2b5876]">{transferLabels.emptyStudents}</p>
                </div>
              ) : null}
            </div>

            {profileError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[#b51d3a]">{profileError}</p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sticky bottom-0 bg-white pt-3 border-t border-[#eef4fa]">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProfileModal}
                  disabled={isProfileFormBusy}
                  className="rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-60"
                >
                  {profileModalCancel}
                </button>
                {!selectedProfileUser?.isStudentRecord ? (
                  <button
                    type="button"
                    onClick={saveProfileChanges}
                    disabled={isProfileFormBusy || !canManageSelectedProfile}
                    className="rounded-lg bg-[#36e7e1] px-4 py-2 text-sm font-semibold text-[#003F60] hover:bg-[#23d2cc] disabled:opacity-60"
                  >
                    {isSavingProfile ? profileModalSaving : profileModalSave}
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                disabled={isProfileFormBusy}
                className={selectedProfileUser?.isActive
                  ? "rounded-lg border border-[#fa4361] px-4 py-2 text-sm font-medium text-[#fa4361] hover:bg-[#fde8eb] disabled:opacity-60"
                  : "rounded-lg border border-[#34D399] px-4 py-2 text-sm font-medium text-[#065f46] hover:bg-[#d1fae5] disabled:opacity-60"}
              >
                {selectedProfileUser?.isActive
                  ? profileModalDeactivate
                  : (profileModalActivate || "Activate user")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showDeactivateConfirm && selectedProfileUser ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#003F60]/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#d6e8f6] bg-white p-5 sm:p-6">
            <h2 className="font-['Sora',Helvetica,Arial,sans-serif] text-lg font-bold text-[#003F60]">
              {selectedProfileUser.isActive ? profileModalDeactivate : (profileModalActivate || "Activate user")}
            </h2>
            <p className="mt-3 text-sm text-[#2b5876]">
              {selectedProfileUser.isActive ? profileModalDeactivateConfirm : (profileModalActivateConfirm || "Activate this user so they can access the platform again?")}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(false)}
                disabled={isProfileFormBusy}
                className="flex-1 rounded-lg border border-[#d6e8f6] px-4 py-2 text-sm font-medium text-[#003F60] hover:bg-[#f5fbff] disabled:opacity-60"
              >
                {profileModalCancel}
              </button>
              <button
                type="button"
                onClick={deactivateUser}
                disabled={isProfileFormBusy}
                className={selectedProfileUser.isActive
                  ? "flex-1 rounded-lg bg-[#fa4361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e63450] disabled:opacity-60"
                  : "flex-1 rounded-lg bg-[#34D399] px-4 py-2 text-sm font-semibold text-[#003F60] hover:bg-[#22c987] disabled:opacity-60"}
              >
                {selectedProfileUser.isActive ? profileModalDeactivateButton : (profileModalActivateButton || "Yes, activate")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
