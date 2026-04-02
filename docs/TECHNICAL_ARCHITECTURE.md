# Technical Architecture

## Overview

Virtuós Institute is a Next.js App Router application with two distinct product surfaces sharing a single codebase:

1. **Marketing site** — Static, pixel-faithful recreation of virtuosinstitute.com.mx. No auth required.
2. **Companion app** — Parent ↔ school staff communication platform. Auth required. (Phase 3+)

Core runtime principles:

- The marketing site is fully statically exportable (`output: 'export'`). No server runtime needed for Phase 1.
- The companion app uses Supabase as backend (auth, database, storage).
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

## Data Flow (Phase 3+ — Companion App)

```
Browser request
  → Next.js authenticated route group (`app/(app)/**`)
  → Supabase Auth (session)
  → Supabase Database (RLS-protected queries for profiles/students/threads/messages/announcements)
  → Supabase Storage (file assets)
```

### Companion Route Strategy

- Public marketing routes remain under `app/**` and continue to support static export behavior.
- Authenticated companion routes live under `app/(app)/**`.
- Guest tour/info flow is exposed through a dedicated public route (for example `app/(public)/tour-calendar/**`) and must not expose any authenticated app data.
- Shared layout concerns (header/footer/theme/i18n) remain centralized and composable between route groups.

### Dashboard Surfaces

The authenticated app is split into three role-scoped dashboard surfaces:

- Superadmin dashboard: `app/(app)/superadmin/**`
  - For platform-wide maintenance and governance.
- School staff dashboard: `app/(app)/staff/**`
  - For school operations (`school_owner`, `direction`, `coordination`, `teacher`, `clerk`).
- Parent dashboard: `app/(app)/parent/**`
  - For parent communication, announcements, and child information.

Post-login routing resolves the user's effective role and sends them to the correct dashboard root. Direct URL access to other dashboard surfaces is denied by middleware and server-side authorization checks.

### Role-Oriented Feature Surfaces

- Superadmin dashboard:
  - global user directory, search/filter by type/role/status
  - user activation/deactivation
  - platform/database/storage usage visibility
  - mailer template administration
- School staff dashboard:
  - role-aware user directory and limited edit controls
  - parent approvals and child onboarding approvals
  - student status tracking (documents, tuition, grades, appointments)
  - notifications, appointments, schedules, and teacher compensation support
- Parent dashboard:
  - child onboarding and profile maintenance
  - school calendar, appointments, notifications, grades, evaluations, and tuition history

### MVP Boundary

- MVP includes the three dashboards, onboarding/approval flows, role-aware user management, notifications, document tracking, school/department calendars, appointments, grades/evaluations, and tuition tracking/manual reconciliation.
- After MVP, consider teacher compensation scheduling/payroll workflows and direct in-platform tuition payments.

### Auth & Authorization

- The implementation-facing source of truth for role capabilities is `docs/ROLE_PERMISSION_MATRIX.md`.
- SQL migration sequencing is documented in `docs/SQL_MIGRATION_PLAN.md`.
- First-pass database policy design is documented in `docs/RLS_POLICY_PLAN.md`.
- Auth provider: Supabase Auth with Google OAuth as the primary sign-in provider.
- App roles are split into platform-level and school-level domains.
- Platform role:
  - `superadmin`: platform maintenance, cross-school governance, highest access.
- School and user roles:
  - `school_owner`: highest school-level access (below superadmin).
  - `direction`: school principal-level access.
  - `coordination`: department-head access.
  - `teacher`
  - `clerk`
  - `parent`
  - `student` (non-login record owned by parent relationship)
  - `guest` (non-login, calendar-only requester)
- Authorization model:
  - `superadmin`: full platform access, including cross-school maintenance operations.
  - `school_owner`: full control of school-side users, assignments, and school content.
  - `direction` and `coordination`: elevated school operations and oversight within school scope.
  - `teacher` and `clerk`: operational access constrained to assigned scopes.
  - `parent`: can access only threads/announcements/student context tied to linked students.
  - `student`: no direct authentication; student information is surfaced through linked parent accounts.
  - `guest`: no login, public calendar-only capability to request a school tour/info appointment.
- Enforcement layers:
  - Route protection for authenticated route groups.
  - Role-based dashboard routing and boundary enforcement.
  - Database-level RLS as the source of truth for access control.

### Identity Strategy

- Authentication identity is created through Google OAuth.
- Students are not authentication identities and are never expected to sign in.
- App-level role and school associations are maintained in database tables, not inferred from OAuth claims alone.
- User authorization always resolves from DB role assignments + school membership context.

### Data Access Layer

- Create typed Supabase clients in `lib/supabase/`:
  - browser client for interactive client components.
  - server client for server components and route handlers.
- Centralize query helpers by domain (`lib/data/messages.ts`, `lib/data/announcements.ts`, etc.) to keep components declarative.
- Add domain modules by capability instead of one large dashboard module:
  - `lib/data/users.ts`
  - `lib/data/students.ts`
  - `lib/data/payments.ts`
  - `lib/data/appointments.ts`
  - `lib/data/calendars.ts`
  - `lib/data/notifications.ts`
  - `lib/data/mailer-templates.ts`
- Generated DB types (`types/database.types.ts`) are the source of truth for table contracts.

### Identity Data Modeling Strategy

- Keep one shared base user table for all authenticated people: `profiles`.
- Do not overload `profiles` with every role-specific field.
- Add role-specific extension tables for required data:
  - `parent_profiles` for parent-only fields (`CURP`, `RFC`, profession, invoice preference)
  - `staff_profiles` for staff identity/compliance fields
  - `students` for non-login student records and student-specific fields
- Store uploaded identity evidence and similar files in a generic `identity_documents` or `media_assets` model with typed metadata, not as direct columns.
- Use audit tables for sensitive authorization changes, especially pickup-authorized people and other incident-sensitive student access changes.

### Required Identity Fields By Role

- Parent:
  - name, email, phone
  - `CURP`
  - `RFC` when invoicing is needed
  - profession
  - government id upload (`INE` or passport image/PDF)
- Student:
  - name, `CURP`, grade level
  - blood type, allergies, enrollment date
  - authorized pickup contacts
  - parent-provided authorization evidence/signoff
- Coordination / Direction / School Owner:
  - name, email, phone
  - government id upload (`INE` or passport image/PDF)
- Teacher / Clerk:
  - same identity/contact requirements as coordination roles
  - teachers additionally need class assignment records

### Mailer Architecture

- Follow the alchemist boundary: app-managed outbound emails through a shared mailer module plus code-owned template builders.
- Recommended modules:
  - `lib/invite-mailer.ts` or `lib/mailer.ts` as the provider boundary
  - `lib/invite-templates/**` or `lib/mailer-templates/**` for template builders
- Email link generation for auth/invite flows stays server-side.
- Notification, appointment-confirmation, appointment-invitation, and approval emails should all use the same provider boundary.
- Template editing in the superadmin dashboard should update stored template content/config, while keeping delivery centralized through the shared mailer boundary.

### Scheduling Strategy

Use one scheduling platform, not three unrelated calendar systems.

- Shared scheduling engine:
  - canonical calendar resources
  - recurring availability rules
  - generated appointment slots
  - scheduled events
  - appointment records + notes
- Role-scoped calendar surfaces built on top of the shared engine:
  - school events calendar
  - clerk/guest tour-info appointment calendar
  - coordination appointment calendar
  - direction appointment calendar
  - teacher schedule calendar (post-MVP)

This gives one persistence model, one slot-generation engine, one permissions model, and several UI views.

### Appointment Model

- Departments with appointment access can define open hours; the system generates selectable slots.
- Guests can only request clerk/tour-info appointments from the public flow.
- Parents can request appointments from allowed departmental calendars after authentication.
- Staff can create appointment requests for parents, which trigger email delivery with a link back to the correct scheduling flow.
- Appointments can be marked `requested`, `confirmed`, `completed`, `canceled`, or `no_show`.
- Appointment notes and outcomes are stored for staff use and can be linked to one or more students for longitudinal recordkeeping.

### Notification Model

- Notifications support immediate send or scheduled send.
- Audience targets include `parents`, `staff`, and `both`.
- Notification payloads can optionally include banner media for dashboard carousel placement.
- Email delivery and in-app dashboard visibility should be modeled separately so one campaign can drive both channels.

### Payments Model

- Tuition is modeled per student and billing period.
- Each tuition period can expose multiple date-based pricing windows (early, standard, late, overdue).
- The system resolves the currently payable amount based on access date and disables expired pricing windows in the UI.
- Every payable tuition record must have a unique payment identifier for reconciliation by staff.
- Direct payment gateway integration (Stripe or Mercado Pago) is a post-MVP extension; MVP supports manual reconciliation and payment instructions.

### Post-MVP Modules

- Teacher scheduling and compensation workflows.
- Payroll receipt generation and settlement tracking.
- Direct payment gateway integrations such as Stripe or Mercado Pago.

### Document & Media Storage

- Hosting split:
  - Vercel hosts the Next.js application.
  - Supabase Storage hosts application file buckets.
- Storage provider decision for MVP: Supabase Storage.
- Buckets remain private for MVP; file access is granted through server-generated signed URLs after app-level permission checks.
- Recommended buckets:
  - `identity-documents`
  - `student-files`
  - `notification-media`
- Recommended path strategy: deterministic school-scoped paths by entity and file kind.
- Recommended path conventions:
  - `identity-documents/school_{schoolId}/parents/{profileId}/{documentType}/{fileId}.{ext}`
  - `identity-documents/school_{schoolId}/staff/{profileId}/{documentType}/{fileId}.{ext}`
  - `identity-documents/school_{schoolId}/students/{studentId}/pickup/{pickupContactId}/{fileId}.{ext}`
  - `student-files/school_{schoolId}/students/{studentId}/documents/{fileId}.{ext}`
  - `student-files/school_{schoolId}/students/{studentId}/grades/{fileId}.pdf`
  - `student-files/school_{schoolId}/students/{studentId}/evaluations/{fileId}.pdf`
  - `notification-media/school_{schoolId}/campaigns/{campaignId}/{fileId}.{ext}`
- Keep path segments stable and identifier-based; do not use mutable names in storage paths.
- Teacher-uploaded grades/evaluations are stored as PDFs in object storage with school-scoped paths.
- Notification banners and carousel media should be image-optimized before upload and stored in object storage with derivative sizes where needed.
- DB rows should store metadata and storage path references, not large binary payloads.
- Identity documents and pickup-authorization evidence should follow the same object-storage-plus-metadata pattern.

### Sensitive Authorization Auditability

- Parent-managed authorized pickup contacts must be fully auditable.
- Track creation, update, activation, and removal events with actor, timestamp, and reason fields.
- Preserve historical records instead of destructive deletes for incident review.

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
| Auth (Phase 3+) | Supabase Auth | Matches storage + DB platform |
| Asset hosting (dev) | `/public` folder | Zero config |
| Asset hosting (prod) | Supabase Storage | Single platform with companion app |
| Deployment | Vercel or AWS (decide at MVP) | Both compatible with Next.js static export |
