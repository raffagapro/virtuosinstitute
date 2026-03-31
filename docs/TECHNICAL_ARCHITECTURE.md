# Technical Architecture

## Overview

Virtuós Institute is a Next.js App Router application with two distinct product surfaces sharing a single codebase:

1. **Marketing site** — Static, pixel-faithful recreation of virtuosinstitute.com.mx. No auth required.
2. **Companion app** — Parent ↔ school staff communication platform. Auth required. (Phase 3 — TBD)

Core runtime principles:

- The marketing site is fully statically exportable (`output: 'export'`). No server runtime needed for Phase 1.
- The companion app will introduce Supabase as the backend (auth, database, storage).
- All user-facing copy goes through the i18n layer — no hardcoded strings in components.
- `components/ui/*` is the single source of truth for primitive UI building blocks.

---

## Main Layers

| Layer | Location | Purpose |
|---|---|---|
| UI routes | `app/**` | Next.js App Router pages |
| UI primitives | `components/ui/**` | Reusable building blocks (AppButton, AppCard, etc.) |
| Layout | `components/layout/**` | Navbar, Footer |
| Marketing sections | `components/marketing/**` | Page-section composites (Hero, Beneficios, etc.) |
| Section modules | `components/marketing/sectionModules.ts` | Central registry + order list for page section composition |
| Style modules | `components/**/*.styles.ts` | Section/component style constants and inline-style tokens |
| i18n | `lib/i18n.ts`, `lib/i18n/messages/**` | Locale resolution and message translation |
| Types | `types/**` | Shared TypeScript contracts |
| Tests | `tests/**` | Unit tests (mirrors source structure) |
| Static assets | `public/**` | Images, fonts, icons |

---

## UI Component Architecture

- `components/ui/*` is the primary source of reusable UI building blocks.
- Repeated presentation across routes/features must be extracted into shared primitives.
- When feature logic is complex or context-specific, use feature-level wrapper components that compose shared primitives.
- Do not duplicate card/list/table/form markup across pages when a primitive or wrapper can be reused.
- Footer/contact primitives are shared through `AppContactInfoGroup` and `AppSocialLinks`.
- Section heading structure is centralized through `AppSectionHeading` (`label`, `title`, `subtitle` variants).
- Repeated checklist rows are centralized through `AppCheckItem` for list and inline card contexts.
- Component styles can be centralized per component via `*.styles.ts` files to enable safer theming updates without changing JSX structure.
- Shared primitive additions require Storybook stories (`*.stories.tsx`) for regression coverage.
- Component naming follows the `App` prefix convention: `AppButton`, `AppCard`, etc.
- Variants use const records keyed by a `tone` or `size` type — no inline conditional class strings.

---

## i18n Architecture

- Supported locales: `en-US`, `es-MX`. Default: `es-MX`.
- Message keys use dot namespace notation: `hero.headline`, `nav.about`, etc.
- `en-US.ts` is the source of truth. `es-MX.ts` must mirror every key (enforced by TypeScript).
- Singular/plural variants use separate keys with a `Plural` suffix.
- `translate(locale, key, params?)` handles `{paramKey}` substitution.
- `LocaleProvider` + `useLocalization()` provide locale context to client components.
- Server components call `translate()` directly with the resolved locale.

---

## Data Flow (Phase 1 — Marketing Site)

```
Browser request
  → Next.js static page (app/page.tsx)
  → Resolves ordered section modules (components/marketing/sectionModules.ts)
  → Renders section components (components/marketing/*)
  → Primitive components (components/ui/*)
  → Static HTML/CSS/JS (no server runtime)
```

### Section Composition Pattern

- Home page section order is centralized in `components/marketing/sectionModules.ts` via `marketingSectionOrder`.
- `getMarketingSections()` maps the order list to concrete section components.
- Add/remove/reorder sections by editing the registry and/or order list, without changing `app/page.tsx`.
- This keeps page structure modular and supports future route-level section variants.

Lead form submission (Phase 1):
- TBD — either a Next.js API route sending email via a third-party provider, or a static form service (e.g. Formspree).

---

## Data Flow (Phase 3 — Companion App, TBD)

```
Browser request
  → Next.js server/client pages
  → Supabase Auth (session)
  → Supabase Database (RLS-protected queries)
  → Supabase Storage (file assets)
```

---

## Design Tokens

Extracted from the live site (virtuosinstitute.com.mx) Divi stylesheet.

### Colors

| Token | Hex | Usage |
|---|---|---|
| `navy` | `#003F60` | Button text, headings, dark text |
| `yellow` | `#FDCC00` | CTA button background, highlights |
| `body-text` | `#666666` | Body copy |
| `background` | `#ffffff` | Page background |

### Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Headings / Buttons | `Sora` | 700 | Google Font; Helvetica, Arial fallback |
| Body | `Open Sans` | 500 | Google Font; Arial fallback |

Body base: `14px`, line-height `1.7em`, `-webkit-font-smoothing: antialiased`.

### Button (CTA)

- Background: `#FDCC00`
- Text color: `#003F60`
- Border radius: `30px`
- Font size: `18px`
- Padding: `14px 48px 14px 36px`

---

## Key Architectural Decisions

| Decision | Choice | Reason |
|---|---|---|
| Framework | Next.js App Router | Static export + future SSR for companion app |
| Styling | Tailwind v4 | Utility-first, consistent with design tokens |
| UI primitives | Hand-rolled (alchemist architecture) | Full ownership, no shadcn dependency |
| i18n | Custom (LocaleProvider + translate()) | Type-safe, simple, no external lib |
| Auth (Phase 3) | Supabase Auth | Matches storage + DB platform |
| Asset hosting (dev) | `/public` folder | Zero config |
| Asset hosting (prod) | Supabase Storage | Single platform with companion app |
| Deployment | Vercel or AWS (decide at MVP) | Both compatible with Next.js static export |
