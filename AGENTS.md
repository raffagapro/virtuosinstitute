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

## Reuse Compliance Gate (Required Before Merge)

- For any new feature UI that resembles existing dashboard modules (search bars, filter rows, directory/table blocks, modal forms), contributors must either:
	- reuse an existing `components/ui/*` primitive or feature wrapper, or
	- extract the repeated presentation markup into `components/ui/*` first and consume it from feature-level wrappers.
- PRs must include a short reuse note stating:
	- which existing component was reused, or
	- why extraction was required and which new shared component was introduced.
- If functionality differs by dashboard/role, keep one shared component API and reduce/expand behavior via props or wrapper-level policy instead of cloning markup.

## Regression Safety

- Add Storybook stories for any new shared primitive or meaningful primitive extension.
- Prefer refactors that preserve existing public component APIs, or introduce wrappers to avoid breaking existing implementations.

## Scope

- Applies to AI-generated code and manual contributor changes.
- Prefer consistency with existing page/component patterns over one-off styling.

## Documentation Maintenance (Required)

- Keep `docs/` in sync with the actual state of the project at all times.
- When implementing a feature, update the relevant doc before or as part of the same work — not after.
- Docs that must be updated when changed:
  - `docs/TECHNICAL_ARCHITECTURE.md` — when adding layers, modules, or changing data flow
  - `docs/DATA_MODEL.md` — when adding/changing database tables or types
  - `docs/CONTRIBUTING_GUIDE.md` — when setup steps, commands, or workflows change
  - `docs/EXECUTION_PLAN.md` — mark tasks done as they are completed
- Do not leave docs describing old behavior after a refactor.

## Cross-Project Architecture Reference (Required)

- Before implementing new utilities, hooks, types, components, or API clients, check `D:\projects\alchemist` to understand established patterns and architecture decisions.
- Follow the same architecture patterns (component naming, variant records, tone props, i18n structure, test layout) — but implement them fresh in this project rather than copying code.
- Do not reinvent patterns that are already solved there; reference the approach and apply it here.

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

## PR Summary Command (Required)

When the user asks for a "PR summary", produce a **GitHub-ready PR body** wrapped in a single fenced code block (``` ``` ```) so it can be copied and pasted directly into the GitHub PR description field without any surrounding prose. Do not produce a conversational summary — only the code block.

Format:
```
## Summary
One or two sentences describing what the PR does and why.

## Changes
Bullet-point list grouped by layer (API, UI, i18n, Tests, Docs). Each bullet names the file (or files) and what changed.

## Testing
Short note on test coverage added and pass/fail status.
```

- Use `git log` and `git diff --stat` to discover the actual changed files before writing the body.
- Keep the tone neutral and technical — suitable for a team code review.
