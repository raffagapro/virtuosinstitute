import { render, screen } from "@testing-library/react";
import { AppSocialLinks } from "@/components/ui";

describe("AppSocialLinks", () => {
  it("renders all social network links", () => {
    render(<AppSocialLinks />);

    expect(screen.getByLabelText("Facebook")).toHaveAttribute(
      "href",
      "https://www.facebook.com/VirtuosInstitute/"
    );
    expect(screen.getByLabelText("Instagram")).toHaveAttribute(
      "href",
      "https://www.instagram.com/virtuos.institute/"
    );
    expect(screen.getByLabelText("WhatsApp")).toHaveAttribute(
      "href",
      "https://wa.me/529992244053"
    );
  });
});
