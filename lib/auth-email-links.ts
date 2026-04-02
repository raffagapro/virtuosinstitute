interface GeneratedLinkProperties {
  action_link?: string | null;
  hashed_token?: string | null;
  verification_type?: string | null;
}

function ensureCallbackPath(baseOrigin: string) {
  return new URL("/auth/callback", baseOrigin);
}

export function buildAuthCallbackUrl(input: {
  baseOrigin: string;
  hashedToken: string;
  verificationType: string;
  nextPath?: string;
}) {
  const callbackUrl = ensureCallbackPath(input.baseOrigin);
  callbackUrl.searchParams.set("token_hash", input.hashedToken);
  callbackUrl.searchParams.set("type", input.verificationType);
  callbackUrl.searchParams.set("next", input.nextPath ?? "/platfrom");
  return callbackUrl.toString();
}

export function resolveGeneratedAuthLink(input: {
  baseOrigin: string;
  properties: GeneratedLinkProperties | null | undefined;
  nextPath?: string;
}) {
  const properties = input.properties;
  const hashedToken = properties?.hashed_token?.trim();
  const verificationType = properties?.verification_type?.trim();

  if (hashedToken && verificationType) {
    return buildAuthCallbackUrl({
      baseOrigin: input.baseOrigin,
      hashedToken,
      verificationType,
      nextPath: input.nextPath,
    });
  }

  const actionLink = properties?.action_link?.trim();
  return actionLink || null;
}
