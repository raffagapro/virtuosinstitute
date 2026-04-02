function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
    return true;
  }

  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
    return false;
  }

  return fallback;
}

export function isGoogleAuthEnabled() {
  return parseBooleanFlag(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED, true);
}

export function isEmailAuthEnabled() {
  const serverFlag = process.env.AUTH_ENABLE_EMAIL_LOGIN;
  if (serverFlag !== undefined) {
    return parseBooleanFlag(serverFlag, false);
  }

  return parseBooleanFlag(process.env.NEXT_PUBLIC_AUTH_EMAIL_ENABLED, false);
}

export function canUseAnyAuthProvider() {
  return isGoogleAuthEnabled() || isEmailAuthEnabled();
}
