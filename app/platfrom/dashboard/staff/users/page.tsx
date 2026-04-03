import { SuperadminUsersDirectory } from "@/app/platfrom/dashboard/superadmin/users/SuperadminUsersDirectory";
import { defaultLocale, translate } from "@/lib/i18n";

export default function StaffUsersDirectoryPage() {
  const locale = defaultLocale;

  return (
    <SuperadminUsersDirectory
      title={translate(locale, "platform.dashboard.staff.usersDirectory.title")}
      subtitle={translate(locale, "platform.dashboard.staff.usersDirectory.subtitle")}
      searchPlaceholder={translate(locale, "platform.dashboard.superadmin.usersDirectory.searchPlaceholder")}
      emptyLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.empty")}
      loadingLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.loading")}
      errorLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.error")}
      statusAllLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.filters.status.all")}
      statusActiveLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.filters.status.active")}
      statusInactiveLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.filters.status.inactive")}
      roleFilterLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.filters.role")}
      roleAllLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.filters.role.all")}
      orderNewestLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.order.newest")}
      orderOldestLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.order.oldest")}
      orderNameLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.order.name")}
      statusColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.status")}
      fullNameColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.fullName")}
      emailColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.email")}
      platformRoleColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.platformRole")}
      membershipRolesColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.membershipRoles")}
      pendingStatusLabel={translate(locale, "platform.status.pending")}
      authorizeModalTitle={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.title")}
      authorizeModalUserLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.user")}
      authorizeModalEmailLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.email")}
      authorizeModalRoleLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.role")}
      authorizeModalCancelLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.cancel")}
      authorizeModalConfirmLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.confirm")}
      authorizeModalSubmittingLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.submitting")}
      authorizeModalErrorLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.authorize.modal.error")}
      roleOptionSchoolOwnerLabel={translate(locale, "platform.roles.school_owner")}
      roleOptionDirectionLabel={translate(locale, "platform.roles.direction")}
      roleOptionCoordinationLabel={translate(locale, "platform.roles.coordination")}
      roleOptionTeacherLabel={translate(locale, "platform.roles.teacher")}
      roleOptionClerkLabel={translate(locale, "platform.roles.clerk")}
      roleOptionParentLabel={translate(locale, "platform.roles.parent")}
      roleOptionStudentLabel={translate(locale, "platform.roles.student")}
      roleOptionGuestLabel={translate(locale, "platform.roles.guest")}
      profileModalTitle={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.title")}
      profileModalFullName={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.fullName")}
      profileModalEmail={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.email")}
      profileModalPhone={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.phone")}
      profileModalPhonePlaceholder={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.phonePlaceholder")}
      profileModalDateOfBirth={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.dateOfBirth")}
      profileModalLanguage={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.language")}
      profileModalCurp={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.curp")}
      profileModalRfc={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.rfc")}
      profileModalProfession={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.profession")}
      profileModalInvoiceRequired={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.invoiceRequired")}
      profileModalStudentGradeLevel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.gradeLevel")}
      profileModalStudentBloodType={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.bloodType")}
      profileModalStudentAllergies={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.allergies")}
      profileModalStudentEnrollmentDate={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.enrollmentDate")}
      profileModalStudentApprovalStatus={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.approvalStatus")}
      profileModalStudentOnboardingStatus={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.onboardingStatus")}
      profileModalStudentDataAuthorizationSignedAt={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.student.dataAuthorizationSignedAt")}
      profileModalTransferSectionTitle={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.sectionTitle")}
      profileModalTransferTargetParentLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParent")}
      profileModalTransferTargetParentSearchPlaceholder={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentSearchPlaceholder"
      )}
      profileModalTransferTargetParentNoMatchesLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentNoMatches"
      )}
      profileModalTransferTargetParentSameAccountLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentSameAccount"
      )}
      profileModalTransferTargetParentSearchingLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentSearching"
      )}
      profileModalTransferTargetParentResolvedLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentResolved"
      )}
      profileModalTransferTargetParentRefineLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.targetParentRefine"
      )}
      profileModalTransferMatchesTitleLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.matchesTitle"
      )}
      profileModalTransferMatchesParentColumnLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.matchesParentColumn"
      )}
      profileModalTransferMatchesEmailColumnLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.matchesEmailColumn"
      )}
      profileModalTransferMatchesActionLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.matchesAction"
      )}
      profileModalTransferStudentsLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.students")}
      profileModalTransferStudentsHintLabel={translate(
        locale,
        "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.studentsHint"
      )}
      profileModalTransferContactCurrentParentLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.contactedCurrentParent")}
      profileModalTransferContactTargetParentLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.contactedTargetParent")}
      profileModalTransferNotesLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.notes")}
      profileModalTransferCreateRequestLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.createRequest")}
      profileModalTransferCreatingRequestLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.creatingRequest")}
      profileModalTransferConfirmPhraseLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.confirmPhrase")}
      profileModalTransferConfirmButtonLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.confirmButton")}
      profileModalTransferConfirmingButtonLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.confirmingButton")}
      profileModalTransferEmptyStudentsLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.emptyStudents")}
      profileModalTransferEmptyCandidatesLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.emptyCandidates")}
      profileModalTransferRequestCreatedLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.requestCreated")}
      profileModalTransferSuccessLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.success")}
      profileModalTransferErrorLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.transfer.error")}
      profileModalYes={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.yes")}
      profileModalNo={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.no")}
      membershipRoleEditLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.membershipRole")}
      membershipRoleSaveLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.membershipRoleSave")}
      membershipRoleSavingLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.membershipRoleSaving")}
      membershipRoleErrorLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.membershipRoleError")}
      profileModalCancel={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.cancel")}
      profileModalSave={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.save")}
      profileModalSaving={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.saving")}
      profileModalDeactivate={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.deactivate")}
      profileModalDeactivateConfirm={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.deactivateConfirm")}
      profileModalDeactivateButton={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.deactivateButton")}
      profileModalError={translate(locale, "platform.dashboard.superadmin.usersDirectory.profile.modal.error")}
      statusApprovedLabel={translate(locale, "platform.status.approved")}
      statusRejectedLabel={translate(locale, "platform.status.rejected")}
      statusSuspendedLabel={translate(locale, "platform.status.suspended")}
      usersDirectoryApiPath="/api/admin/users-directory"
    />
  );
}
