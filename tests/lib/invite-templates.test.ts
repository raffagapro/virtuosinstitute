import { buildParentApprovedEmail } from "@/lib/invite-templates/parent-approved";
import { buildParentReviewEmail } from "@/lib/invite-templates/parent-review";
import { buildPasswordResetEmail } from "@/lib/invite-templates/password-reset";
import { buildSignupConfirmationEmail } from "@/lib/invite-templates/signup-confirmation";

describe("buildParentReviewEmail", () => {
  it("builds localized English review email content", () => {
    const result = buildParentReviewEmail({
      locale: "en-US",
      fullName: "Parent Name",
      homeUrl: "https://virtuos.example/",
    });

    expect(result.subject).toBe("Your Virtuós account is under review");
    expect(result.text).toContain("Hello Parent Name, your account has been created and is being reviewed by staff.");
    expect(result.text).toContain("https://virtuos.example/");
  });

  it("builds localized Spanish review email content", () => {
    const result = buildParentReviewEmail({
      locale: "es-MX",
      fullName: "Padre",
      homeUrl: "https://virtuos.example/",
    });

    expect(result.subject).toBe("Tu cuenta de Virtuós esta en revision");
    expect(result.text).toContain("Hola Padre, tu cuenta ha sido creada y esta siendo revisada por el personal.");
  });
});

describe("buildParentApprovedEmail", () => {
  it("builds localized English approved email content", () => {
    const result = buildParentApprovedEmail({
      locale: "en-US",
      fullName: "Parent Name",
      platformUrl: "https://virtuos.example/platfrom",
    });

    expect(result.subject).toBe("Your Virtuós account is approved");
    expect(result.text).toContain("Hello Parent Name, your account has been approved.");
    expect(result.text).toContain("https://virtuos.example/platfrom");
  });

  it("builds localized Spanish approved email content", () => {
    const result = buildParentApprovedEmail({
      locale: "es-MX",
      fullName: "Padre",
      platformUrl: "https://virtuos.example/platfrom",
    });

    expect(result.subject).toBe("Tu cuenta de Virtuós fue aprobada");
    expect(result.text).toContain("Hola Padre, tu cuenta ha sido aprobada.");
  });
});

describe("auth email templates", () => {
  it("builds localized password reset content", () => {
    const result = buildPasswordResetEmail({
      locale: "en-US",
      fullName: "Parent Name",
      resetUrl: "https://virtuos.example/auth/callback?token_hash=test&type=recovery",
    });

    expect(result.subject).toBe("Reset your Virtuós password");
    expect(result.text).toContain("Hello Parent Name, we received a request to reset your password.");
    expect(result.text).toContain("type=recovery");
  });

  it("builds localized signup confirmation content", () => {
    const result = buildSignupConfirmationEmail({
      locale: "es-MX",
      fullName: "Padre",
      confirmationUrl: "https://virtuos.example/auth/callback?token_hash=test&type=signup",
    });

    expect(result.subject).toBe("Confirma tu cuenta de Virtuós");
    expect(result.text).toContain("Hola Padre, confirma tu correo para activar tu acceso a Virtuós.");
    expect(result.text).toContain("type=signup");
  });
});