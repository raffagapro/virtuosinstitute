import { buildAuthCallbackUrl, resolveGeneratedAuthLink } from "@/lib/auth-email-links";

describe("auth email links", () => {
  it("builds callback links with token hash", () => {
    const link = buildAuthCallbackUrl({
      baseOrigin: "https://virtuos.example",
      hashedToken: "abc123",
      verificationType: "recovery",
      nextPath: "/auth/update-password",
    });

    expect(link).toBe("https://virtuos.example/auth/callback?token_hash=abc123&type=recovery&next=%2Fauth%2Fupdate-password");
  });

  it("prefers token hash links over action links", () => {
    const link = resolveGeneratedAuthLink({
      baseOrigin: "https://virtuos.example",
      properties: {
        hashed_token: "hashed-token",
        verification_type: "signup",
        action_link: "https://fallback.example",
      },
      nextPath: "/platfrom",
    });

    expect(link).toContain("token_hash=hashed-token");
    expect(link).toContain("type=signup");
  });

  it("falls back to action link when token hash properties are missing", () => {
    const link = resolveGeneratedAuthLink({
      baseOrigin: "https://virtuos.example",
      properties: {
        action_link: "https://fallback.example/link",
      },
    });

    expect(link).toBe("https://fallback.example/link");
  });
});
