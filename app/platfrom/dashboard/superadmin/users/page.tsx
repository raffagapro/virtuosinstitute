import { defaultLocale, translate } from "@/lib/i18n";
import { SuperadminUsersDirectory } from "@/app/platfrom/dashboard/superadmin/users/SuperadminUsersDirectory";

export default function SuperadminUsersDirectoryPage() {
  const locale = defaultLocale;

  return (
    <SuperadminUsersDirectory
      title={translate(locale, "platform.dashboard.superadmin.usersDirectory.title")}
      subtitle={translate(locale, "platform.dashboard.superadmin.usersDirectory.subtitle")}
      emptyLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.empty")}
      loadingLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.loading")}
      errorLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.error")}
      fullNameColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.fullName")}
      emailColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.email")}
      platformRoleColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.platformRole")}
      membershipRolesColumnLabel={translate(locale, "platform.dashboard.superadmin.usersDirectory.columns.membershipRoles")}
    />
  );
}
