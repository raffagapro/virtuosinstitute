import { render, screen } from "@testing-library/react";
import { AppCheckItem } from "@/components/ui";

describe("AppCheckItem", () => {
  it("renders checklist row text", () => {
    render(
      <ul>
        <AppCheckItem>Checklist text</AppCheckItem>
      </ul>
    );

    expect(screen.getByText("Checklist text")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("supports alternate element tags", () => {
    const { container } = render(
      <AppCheckItem as="div">Inline row</AppCheckItem>
    );

    expect(container.querySelector("div")).not.toBeNull();
    expect(screen.getByText("Inline row")).toBeInTheDocument();
  });
});
