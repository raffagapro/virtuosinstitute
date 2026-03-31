# Contributing Guide

## Local Setup

1. Install Node.js >= 20
2. Clone the repo
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```
   Fill in the required values (see `.env.example` for descriptions).
5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Available Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Serve production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (jest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run storybook` | Start Storybook component explorer (port 6006) |
| `npm run build-storybook` | Build static Storybook |

---

## Testing Workflow

- Tests live in `tests/` and mirror the source structure:
  - `tests/components/` for component helpers
  - `tests/lib/` for utility functions
- Run all tests with `npm test`.
- Every new implementation must have corresponding unit tests covering primary behavior and key edge cases.
- Use `@jest/globals` imports (`describe`, `it`, `expect`) — do not rely on globals.

---

## UI Library Workflow

- Before creating a new component, check `components/ui/*` for an existing primitive.
- New shared primitives go in `components/ui/` and require a `.stories.tsx` file alongside them.
- Marketing-site-specific composites go in `components/marketing/`.
- Layout wrappers (Navbar, Footer) go in `components/layout/`.
- Component names use the `App` prefix: `AppButton`, `AppCard`, etc.

### Marketing Section Modules

- Home page composition is module-driven via `components/marketing/sectionModules.ts`.
- To add a section:
   1. Create the section component in `components/marketing/`.
   2. Register it in `marketingSectionRegistry`.
   3. Add its id to `marketingSectionOrder` where it should appear.
- To remove or reorder sections, edit only `marketingSectionOrder`.
- Keep `app/page.tsx` declarative by rendering from `getMarketingSections()`.

---

## Localization Workflow

1. Add the new key to `lib/i18n/messages/en-US.ts` first.
2. Add the matching key to `lib/i18n/messages/es-MX.ts`.
3. TypeScript will error if `es-MX.ts` is missing any key defined in `en-US.ts`.
4. Use `{paramKey}` syntax in message strings for runtime substitution.
5. For count-sensitive copy, add separate `key` and `keyPlural` variants.
6. Never use hardcoded user-facing strings in components or pages.

---

## Documentation Workflow

Keep `docs/` in sync as you work:

- `docs/EXECUTION_PLAN.md` — mark tasks complete as you finish them.
- `docs/TECHNICAL_ARCHITECTURE.md` — update when adding new layers, modules, or changing data flow.
- `docs/DATA_MODEL.md` — update when adding or changing database tables or TypeScript types.
- `docs/CONTRIBUTING_GUIDE.md` (this file) — update when setup steps or commands change.

---

## Code Guidelines

- TypeScript strict mode — no `any` unless unavoidable.
- All user-facing copy through i18n keys — no hardcoded strings.
- Client components (`'use client'`) only when interactivity requires it.
- Prefer server components for data fetching and static rendering.
- Use `cn()` from `components/ui/cn.ts` to merge Tailwind class names.
- Variant classes live in const records keyed by type — not inline ternaries.

---

## Pull Request Checklist

- [ ] New primitives have `.stories.tsx` files
- [ ] New implementations have unit tests
- [ ] i18n keys added to both `en-US.ts` and `es-MX.ts`
- [ ] Relevant docs updated
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
