import { render, screen } from "@testing-library/react";
import { AppContactInfoGroup } from "@/components/ui";

describe("AppContactInfoGroup", () => {
  it("renders title and children", () => {
    render(
      <AppContactInfoGroup title="Label" titleClassName="title" className="wrapper">
        <span>Value content</span>
      </AppContactInfoGroup>
    );

    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByText("Value content")).toBeInTheDocument();
  });
});
