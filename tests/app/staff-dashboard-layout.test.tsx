import { render } from "@testing-library/react";
import StaffDashboardLayout from "@/app/platfrom/dashboard/staff/layout";

const mockSidebar = jest.fn(() => <nav data-testid="sidebar" />);

jest.mock("@/app/platfrom/dashboard/PlatformDashboardGate", () => ({
  PlatformDashboardGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/layout", () => ({
  AppFooter: () => <footer data-testid="footer" />,
}));

jest.mock("@/components/ui", () => ({
  AppDashboardNavbar: () => <header data-testid="navbar" />,
  AppDashboardSidebar: (props: unknown) => mockSidebar(props),
}));

describe("StaffDashboardLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("enables pending authorization badge on users sidebar item", () => {
    render(
      <StaffDashboardLayout>
        <div>child</div>
      </StaffDashboardLayout>
    );

    expect(mockSidebar).toHaveBeenCalled();

    const firstCallProps = mockSidebar.mock.calls[0][0] as {
      pendingUsersBadgeLabel?: string;
      items: Array<{ href: string; showPendingAuthBadge?: boolean }>;
    };

    expect(firstCallProps.pendingUsersBadgeLabel).toBeTruthy();

    const usersItem = firstCallProps.items.find((item) => item.href === "/platfrom/dashboard/staff/users");
    expect(usersItem?.showPendingAuthBadge).toBe(true);
  });
});
