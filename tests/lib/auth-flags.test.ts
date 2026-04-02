import { canUseAnyAuthProvider, isEmailAuthEnabled, isGoogleAuthEnabled } from "@/lib/auth-flags";

describe("auth flags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("enables google auth by default", () => {
    delete process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED;
    expect(isGoogleAuthEnabled()).toBe(true);
  });

  it("disables email auth by default", () => {
    delete process.env.AUTH_ENABLE_EMAIL_LOGIN;
    delete process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED;
    expect(isEmailAuthEnabled()).toBe(false);
  });

  it("prefers server email auth flag over public fallback", () => {
    process.env.AUTH_ENABLE_EMAIL_LOGIN = "true";
    process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED = "false";
    expect(isEmailAuthEnabled()).toBe(true);
  });

  it("checks if any provider is available", () => {
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED = "false";
    process.env.AUTH_ENABLE_EMAIL_LOGIN = "true";
    expect(canUseAnyAuthProvider()).toBe(true);
  });
});
