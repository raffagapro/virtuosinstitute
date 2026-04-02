import type { Meta, StoryObj } from "@storybook/nextjs";
import { AppDashboardCard } from "./AppDashboardCard";

const meta: Meta<typeof AppDashboardCard> = {
  title: "UI/AppDashboardCard",
  component: AppDashboardCard,
  args: {
    title: "User management",
    description: "Search and manage account access and role assignments.",
  },
};

export default meta;
type Story = StoryObj<typeof AppDashboardCard>;

export const Default: Story = {};
