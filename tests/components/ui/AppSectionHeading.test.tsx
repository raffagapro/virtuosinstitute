import { render, screen } from "@testing-library/react";
import { AppSectionHeading } from "@/components/ui";

describe("AppSectionHeading", () => {
  it("renders label, title and subtitle", () => {
    render(
      <AppSectionHeading
        label="Label"
        title="Main title"
        subtitle="Subtitle text"
      />
    );

    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Main title" })).toBeInTheDocument();
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
  });

  it("renders only required title", () => {
    render(<AppSectionHeading title="Only title" />);

    expect(screen.getByRole("heading", { name: "Only title" })).toBeInTheDocument();
  });
});
