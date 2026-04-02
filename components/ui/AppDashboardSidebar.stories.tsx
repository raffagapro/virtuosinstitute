import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppDashboardSidebar } from "./AppDashboardSidebar";

const meta: Meta<typeof AppDashboardSidebar> = {
  title: "UI/AppDashboardSidebar",
  component: AppDashboardSidebar,
  args: {
    ariaLabel: "Pages",
    items: [{ href: "/platfrom/dashboard/superadmin/users", label: "Users directory" }],
  },
};

export default meta;
type Story = StoryObj<typeof AppDashboardSidebar>;

export const Default: Story = {};
