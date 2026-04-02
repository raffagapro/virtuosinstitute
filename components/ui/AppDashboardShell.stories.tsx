import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppDashboardShell } from "./AppDashboardShell";

const meta: Meta<typeof AppDashboardShell> = {
  title: "UI/AppDashboardShell",
  component: AppDashboardShell,
  args: {
    badge: "Superadmin",
    title: "Platform control center",
    subtitle: "Use this shell as the base for role dashboards with different capability visibility.",
    logoAriaLabel: "Virtuós Institute",
    profileLabel: "Profile",
    signOutLabel: "Sign out",
    signingOutLabel: "Signing out...",
    loadingIdentityLabel: "Loading account",
    roleSuperadminLabel: "Superadmin",
    roleStaffLabel: "Staff",
    roleParentLabel: "Parent",
    children: (
      <>
        <article className="rounded-2xl border border-[#d6e8f6] bg-white p-5">Card 1</article>
        <article className="rounded-2xl border border-[#d6e8f6] bg-white p-5">Card 2</article>
        <article className="rounded-2xl border border-[#d6e8f6] bg-white p-5">Card 3</article>
      </>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof AppDashboardShell>;

export const Default: Story = {};
