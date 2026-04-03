import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  AppUsersDirectoryControls,
  type AppUsersDirectoryOrderFilter,
  type AppUsersDirectoryStatusFilter,
} from "./AppUsersDirectoryControls";

function AppUsersDirectoryControlsStory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppUsersDirectoryStatusFilter>("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState<AppUsersDirectoryOrderFilter>("newest");

  return (
    <AppUsersDirectoryControls
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder="Search by name or email"
      statusFilter={statusFilter}
      onStatusFilterChange={setStatusFilter}
      statusAllLabel="All"
      statusActiveLabel="Active"
      statusInactiveLabel="Inactive"
      roleFilterLabel="Role"
      roleFilter={roleFilter}
      onRoleFilterChange={setRoleFilter}
      roleAllLabel="All roles"
      roleOptions={["parent", "teacher", "clerk"]}
      orderFilter={orderFilter}
      onOrderFilterChange={setOrderFilter}
      orderNewestLabel="Newest"
      orderOldestLabel="Oldest"
      orderNameLabel="Name A-Z"
    />
  );
}

const meta: Meta<typeof AppUsersDirectoryControls> = {
  title: "UI/AppUsersDirectoryControls",
  component: AppUsersDirectoryControls,
};

export default meta;
type Story = StoryObj<typeof AppUsersDirectoryControls>;

export const Default: Story = {
  render: () => <AppUsersDirectoryControlsStory />,
};
