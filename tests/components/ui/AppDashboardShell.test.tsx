import { render, screen } from "@testing-library/react";
import { AppDashboardShell } from "@/components/ui/AppDashboardShell";

describe("AppDashboardShell", () => {
  it("renders badge, title, subtitle and children", () => {
    render(
      <AppDashboardShell
        badge="Superadmin"
        title="Platform control center"
        subtitle="Manage users and approvals"
        logoAriaLabel="Virtuós Institute"
        profileLabel="Profile"
        signOutLabel="Sign out"
        signingOutLabel="Signing out..."
        loadingIdentityLabel="Loading account"
        roleSuperadminLabel="Superadmin"
        roleStaffLabel="Staff"
        roleParentLabel="Parent"
      >
        <article>Users</article>
      </AppDashboardShell>
    );

    expect(screen.getByText("Superadmin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Platform control center" })).toBeInTheDocument();
    expect(screen.getByText("Manage users and approvals")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
