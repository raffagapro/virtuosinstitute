import { render, screen } from "@testing-library/react";
import { AppDashboardCard } from "@/components/ui/AppDashboardCard";

describe("AppDashboardCard", () => {
  it("renders title and description", () => {
    render(
      <AppDashboardCard
        title="User management"
        description="Search and manage account access and role assignments."
      />
    );

    expect(screen.getByRole("heading", { name: "User management" })).toBeInTheDocument();
    expect(screen.getByText("Search and manage account access and role assignments.")).toBeInTheDocument();
  });
});
