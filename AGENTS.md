# Agent Working Agreement

## UI Component Reuse (Required)

When implementing UI changes, always reuse existing components and patterns first.

1. Check `components/ui/*` primitives first.
2. Check existing feature components/pages for reusable patterns.
3. Create or extend a component only when no existing option is a good fit.

## Component Architecture Directive (Required)

- Treat the UI library as the primary source of building blocks.
- When repeated UI appears in multiple features, extract it into `components/ui/*` and reuse it.
- For complex feature logic that should not leak into primitives, wrap library components in feature-level wrapper components.
- Do not duplicate card/list/table/form presentation markup across pages when a shared primitive or wrapper can be used.

## Regression Safety

- Add Storybook stories for any new shared primitive or meaningful primitive extension.
- Prefer refactors that preserve existing public component APIs, or introduce wrappers to avoid breaking existing implementations.

## Scope

- Applies to AI-generated code and manual contributor changes.
- Prefer consistency with existing page/component patterns over one-off styling.

## Cross-Project Code Reuse (Required)

- Before implementing new utilities, hooks, types, components, or API clients, check `D:\projects\alchemist` for existing equivalents.
- Prefer copying and adapting code from `D:\projects\alchemist` over writing from scratch when the logic is substantially similar.
- Do not duplicate solutions that already exist there — reference, port, or import them instead.

## Unit Testing (Required)

- Every new implementation must have corresponding unit tests.
- Tests should cover the primary behavior and key edge cases of the implementation.

## Localization Coverage (Required)

- All user-facing copy must use i18n message keys; avoid hardcoded UI text in pages/components.
- Add new keys to `lib/i18n/messages/en-US.ts` first, then add matching keys in `lib/i18n/messages/es-MX.ts`.
- For relative-time or count-based copy, include singular/plural key variants and pass params through localization helpers.
- Work is not complete until EN/ES message maps stay type-safe with no missing-key errors.

## Auth Email Flows (Required)

- Keep delivery boundaries consistent:
	- Invite emails are app-managed via Brevo template builders.
	- Password recovery emails are app-managed via Brevo (`/api/auth/request-password-reset`).
	- Sign-up confirmation emails are app-managed via Brevo (`/api/auth/request-signup-confirmation`).
- For email link robustness across browsers/devices, prefer callback token-hash links:
	- `/auth/callback?token_hash=...&type=...`
	- Avoid relying on browser-bound PKCE code-verifier links in custom app-managed emails.
- When using `auth.admin.generateLink`, build callback links from `hashed_token` + `verification_type` when available; only fall back to `action_link` if required.
- If auth callback receives a legacy PKCE verifier mismatch, route users to sign-in with guidance instead of leaving callback flow stalled.
