import { fireEvent, render, screen } from "@testing-library/react";
import { AppUsersDirectoryControls } from "@/components/ui";

describe("AppUsersDirectoryControls", () => {
  it("renders search and filter controls", () => {
    render(
      <AppUsersDirectoryControls
        searchTerm=""
        onSearchTermChange={() => undefined}
        searchPlaceholder="Search users"
        statusFilter="all"
        onStatusFilterChange={() => undefined}
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        roleFilterLabel="Role"
        roleFilter="all"
        onRoleFilterChange={() => undefined}
        roleAllLabel="All roles"
        roleOptions={["parent", "teacher", "student"]}
        orderFilter="newest"
        onOrderFilterChange={() => undefined}
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
      />
    );

    expect(screen.getByRole("searchbox", { name: "Search users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inactive" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All roles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Teacher" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Student" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Newest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oldest" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name A-Z" })).toBeInTheDocument();
  });

  it("calls handlers when controls change", () => {
    const onSearchTermChange = jest.fn();
    const onStatusFilterChange = jest.fn();
    const onRoleFilterChange = jest.fn();
    const onOrderFilterChange = jest.fn();

    render(
      <AppUsersDirectoryControls
        searchTerm=""
        onSearchTermChange={onSearchTermChange}
        searchPlaceholder="Search users"
        statusFilter="all"
        onStatusFilterChange={onStatusFilterChange}
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        roleFilterLabel="Role"
        roleFilter="all"
        onRoleFilterChange={onRoleFilterChange}
        roleAllLabel="All roles"
        roleOptions={["parent", "teacher"]}
        orderFilter="newest"
        onOrderFilterChange={onOrderFilterChange}
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
      />
    );

    fireEvent.change(screen.getByRole("searchbox", { name: "Search users" }), {
      target: { value: "ana" },
    });
    expect(onSearchTermChange).toHaveBeenCalledWith("ana");

    fireEvent.click(screen.getByRole("button", { name: "Inactive" }));
    expect(onStatusFilterChange).toHaveBeenCalledWith("inactive");

    fireEvent.click(screen.getByRole("button", { name: "Teacher" }));
    expect(onRoleFilterChange).toHaveBeenCalledWith("teacher");

    fireEvent.click(screen.getByRole("button", { name: "Name A-Z" }));
    expect(onOrderFilterChange).toHaveBeenCalledWith("name");
  });

  it("uses role-specific active color for selected role button", () => {
    render(
      <AppUsersDirectoryControls
        searchTerm=""
        onSearchTermChange={() => undefined}
        searchPlaceholder="Search users"
        statusFilter="all"
        onStatusFilterChange={() => undefined}
        statusAllLabel="All"
        statusActiveLabel="Active"
        statusInactiveLabel="Inactive"
        roleFilterLabel="Role"
        roleFilter="teacher"
        onRoleFilterChange={() => undefined}
        roleAllLabel="All roles"
        roleOptions={["parent", "teacher"]}
        orderFilter="newest"
        onOrderFilterChange={() => undefined}
        orderNewestLabel="Newest"
        orderOldestLabel="Oldest"
        orderNameLabel="Name A-Z"
      />
    );

    expect(screen.getByRole("button", { name: "Teacher" })).toHaveClass("bg-[#34D399]");
  });
});
