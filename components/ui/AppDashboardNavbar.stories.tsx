import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppDashboardNavbar } from "./AppDashboardNavbar";

const meta: Meta<typeof AppDashboardNavbar> = {
  title: "UI/AppDashboardNavbar",
  component: AppDashboardNavbar,
  args: {
    logoAriaLabel: "Virtuós Institute",
    profileLabel: "Profile",
    signOutLabel: "Sign out",
    signingOutLabel: "Signing out...",
    loadingIdentityLabel: "Loading account",
    roleSuperadminLabel: "Superadmin",
    roleStaffLabel: "Staff",
    roleParentLabel: "Parent",
  },
};

export default meta;
type Story = StoryObj<typeof AppDashboardNavbar>;

export const Default: Story = {};
