# Virtuós Institute — Execution Plan

## Status Legend
- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

## Related Docs
- [TECHNICAL_ARCHITECTURE.md](TECHNICAL_ARCHITECTURE.md)
- [DATA_MODEL.md](DATA_MODEL.md)
- [ROLE_PERMISSION_MATRIX.md](ROLE_PERMISSION_MATRIX.md)
- [SQL_MIGRATION_PLAN.md](SQL_MIGRATION_PLAN.md)
- [RLS_POLICY_PLAN.md](RLS_POLICY_PLAN.md)
- [CONTRIBUTING_GUIDE.md](CONTRIBUTING_GUIDE.md)

---

## Phase 1 — Foundation

- [x] Write execution plan
- [x] Install dependencies (clsx, lucide-react, jest, storybook)
- [x] Create UI primitives with architecture similar to `D:\projects\alchemist`
- [x] Set up i18n (LocaleProvider, translate(), EN + ES message files)
- [x] Set up jest + test structure

## Phase 2 — Marketing Site (pixel-faithful recreation of virtuosinstitute.com.mx)

### Layout
- [x] Navbar (logo, anchor links)
- [x] Footer (logo, social links, contact info)

### Page Sections (top → bottom)
- [x] Hero — headline, subtitle, CTA button, decorative images
- [x] Sobre Nosotros — school description, 8 values grid
- [x] Beneficios — 8 differentiator cards (image + icon + title + description)
- [x] Enfoque — 3 numbered pillars (Académica, Artística, Socioemocional)
- [x] CTA Banner — "¡Fomentamos el aprendizaje significativo!"
- [x] Oferta Educativa — Kinder & Primaria program cards
- [x] Testimonios — family testimonial(s)
- [x] Contact / Lead Form — enrollment form + address + social icons

### Wire-up
- [x] Compose all sections in `app/page.tsx`
- [x] Add modular section registry (`components/marketing/sectionModules.ts`) to support easy add/remove/reorder
- [x] i18n keys complete (EN + ES, no missing keys)
- [x] Static export verified (`next build`)

## Phase 3 — Companion App Foundations

### Product Scope Definition
- [x] Define first-release scope: parent ↔ school communication + school announcements
- [x] Define auth provider strategy: Google account sign-in for platform users
- [x] Define student identity strategy: students never log in; all student data is managed and viewed through parent accounts
- [x] Define guest strategy: no login; public calendar-only access to request school tour and information appointment
- [x] Define role-permission matrix for dashboard boundaries and feature/module access
- [x] Define initial SQL migration structure and first RLS policy plan
- [x] Define dashboard architecture: three dashboards with role-based access levels
  - Superadmin dashboard (platform maintenance)
  - School staff dashboard (school operations)
  - Parent dashboard (family and student information)
- [x] Define calendar strategy: one scheduling platform with role-scoped calendar surfaces
  - School events calendar
  - Department appointment calendars (clerk/tours, coordination, direction)
  - Teacher schedule calendar (post-MVP)
- [x] Define MVP boundary: most operational, communication, onboarding, notification, appointment, document, and tuition-tracking features are in MVP
- [x] Define post-MVP deferrals:
  - teacher hours/scheduling for compensation workflows
  - payroll/receipt generation for staff payments
  - direct in-platform payments (Stripe/Mercado Pago)
- [x] Define platform roles and hierarchy:
  - `superadmin` (platform maintenance, highest access)
  - `school_owner` (highest school-level access, below superadmin)
  - `direction` (school principal)
  - `coordination` (department head)
  - `teacher`
  - `clerk`
  - `parent`
  - `student` (non-login profile only)
  - `guest`
- [x] Define first-release navigation: parent dashboard, messages, announcements, profile

### Technical Setup
- [x] Add Supabase project configuration and env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Configure Supabase Auth provider for Google OAuth sign-in flow
- [x] Add feature-flagged email/password auth path for QA and future optional rollout
- [ ] Add Google account switch/recovery flow for users who lose access to their current Google auth account
  - [ ] Add "I lost access to this Google account" request path from sign-in/review screens
  - [ ] Add verified recovery workflow to link a replacement Google identity to the existing profile/memberships
  - [ ] Add superadmin approval boundary and audit log for identity-link changes
  - [ ] Revoke active sessions on account switch and notify both old/new contact emails when available
- [~] Add app-managed mailer boundary following alchemist-style architecture (`lib/invite-mailer.ts` + template builders)
  - [x] Brevo provider boundary via `lib/invite-mailer.ts`
  - [x] Localized onboarding email templates for parent review and approval notifications
  - [x] Parent receives email when account is created and enters review
  - [x] Parent receives email when staff approves access
  - [x] Add password recovery and signup-confirmation app-managed emails
- [ ] Configure Supabase Storage private buckets (`identity-documents`, `student-files`, `notification-media`)
- [ ] Define deterministic storage path conventions by entity and file kind
- [x] Add typed Supabase browser/server clients in `lib/supabase/`
- [ ] Add route groups for authenticated app shell (`app/(app)/...`) while preserving static marketing routes
- [ ] Add protected-route middleware strategy for companion routes
- [ ] Add public guest calendar route (`app/(public)/tour-calendar`) with no-auth access and strict scope guard
- [x] Add dashboard route shells:
  - `/platfrom/dashboard/superadmin`
  - `/platfrom/dashboard/staff`
  - `/platfrom/dashboard/parent`
- [x] Add role-to-dashboard resolver and post-login redirect policy
  - [x] Added `resolveDashboardPath` helper to route by `platform_role` + approved membership roles
  - [x] Bootstrap API now returns `dashboardPath` for approved users
  - [x] `/platfrom/dashboard` now acts as a resolver route and redirects to role-specific dashboards
  - [x] Added shared dashboard shell + navbar baseline for role dashboards with static-site visual style and top-right signout action
  - [x] Added shared static-site footer to dashboard shells (superadmin/staff/parent)
  - [x] Updated dashboard navbar logo to return to static home page and tuned dashboard footer to compact spacing
  - [x] Added superadmin sidebar navigation baseline with page links (`/platfrom/dashboard/superadmin` home and `/platfrom/dashboard/superadmin/users`)
  - [x] Added secure superadmin users-directory API and initial table view for all users
  - [x] Added users-directory controls: name/email search, active/inactive filters, role filter, and ordering options
  - [x] Added pending-authorization priority ordering in users-directory table rows
  - [x] Added sidebar notification badge with pending users-to-authorize count
  - [x] Synced users-directory table refresh with sidebar pending-notification refresh triggers (custom event driven)
  - [x] Updated parent-transfer target search to debounce + explicit status feedback (searching/matches/selected)
  - [x] Updated parent-transfer search results to render as a table with per-row transfer action + explicit child selection (no auto-select-all)
  - [x] Added localized phone placeholders in profile editors to suggest format while allowing international numbers

### Data & Auth Setup
- [x] Create initial schema migration (schools, profiles, school_memberships, parent_profiles, staff_profiles, identity_documents, parent_approval_requests, students, student_guardians, student_documents, student_pickup_contacts, student_pickup_authorizations, student_pickup_audit_logs, academic_classes, teacher_class_assignments, student_tuition_accounts, tuition_periods, tuition_quotes, payment_records, threads, thread_participants, messages, announcements, notification_campaigns, notification_deliveries, media_assets, calendars, calendar_events, availability_rules, appointment_slots, appointments, appointment_notes, guest_tour_requests)
- [x] Configure role model with platform role (`superadmin`) and school roles (`school_owner`, `direction`, `coordination`, `teacher`, `clerk`)
- [x] Add baseline RLS policies for superadmin/platform maintenance and role-scoped access boundaries
- [ ] Add storage metadata and signed-URL access flow for private files
- [~] Add approval workflow: parent Google signup -> staff approval -> parent can register children -> staff approves child records
  - [x] Parent first sign-in bootstrap (create `profiles`, pending `school_memberships`, pending `parent_approval_requests`)
  - [x] Approval-gated platform entry state (`pending` / `approved` / `rejected` / `suspended`)
  - [x] Superadmin approval action endpoint for parent onboarding review status updates
  - [x] Pending/suspended users are signed out and shown review-only messaging with home navigation
  - [x] Pending-review state keeps Google sign-in action visible so users can re-check access after approval
  - [x] Approved state redirects directly to `/platfrom/dashboard` (no intermediate approved panel)
  - [x] Rejected users are fully removed from app/auth records during bootstrap (`profiles`, `school_memberships`, `parent_approval_requests`, `auth.users`)
  - [x] Missing server credentials fail gracefully with setup message (no unhandled env crash)
  - [x] Account-created review email is sent on first onboarding bootstrap when mailer is configured
  - [x] Approval email is sent when staff approves account access when mailer is configured
  - [ ] Parent child-registration flow unlock after approved status
  - [ ] Staff child-record approval queue UI and actions

### Single-School Refactor (Option 2)
- [x] Remove school dependency from runtime onboarding flow
  - [x] Added migration `011_single_school_global_onboarding.sql` to make onboarding `school_id` optional and switch onboarding RLS checks to global membership roles
  - [x] Added migration `012_detach_schools_foreign_keys.sql` to drop FK references from public tables to `schools` and make remaining `school_id` columns nullable
  - [x] Added migration `013_drop_school_columns_and_table.sql` to drop remaining `school_id` columns and remove `schools` table entirely
  - [x] Updated `/api/auth/platform-bootstrap` to create/read parent onboarding records without `school_id`
  - [x] Updated `/api/admin/parent-approvals` to approve/reject parent onboarding without `school_id`
  - [x] Added `npm run db:push` aliases for linked/local migration pushes
  - [x] Completed runtime reference sweep in `app/**`, `lib/**`, and `tests/**` for `school_id` / school-scope helper usage
- [ ] Add required-field validation by role (parent, student, coordination/direction/owner, teacher)
- [x] Add required-field schema fields by role (migration 014)
  - [x] Added `date_of_birth` to `parent_profiles`
  - [x] Added `date_of_birth`, `data_authorization_signed_at`, `data_authorization_signed_by_profile_id` to `students`
  - [x] Added `grade_of_interest` to `guest_tour_requests`
  - [x] Added `date_of_birth` field to parent profile form and API
- [x] Added shared profile birth-date field (migration 015)
  - [x] Added `date_of_birth` to `profiles` so parent/staff/superadmin can edit it
- [ ] Add required-field completeness validation and checklist UI by role (parent, student, coordination/direction/owner, teacher)
- [ ] Add seed data for local development and QA

### DX & Quality Setup
- [ ] Add unit tests for auth/data-access helpers
- [ ] Add integration test plan for key flows (sign-in, thread view, send message, announcements)
- [ ] Add Storybook coverage for new shared primitives introduced by companion app

## Phase 4 — Companion App MVP (Parent Experience)

### Parent Dashboard
- [ ] Show parent-linked students summary cards
- [ ] Show latest announcements list
- [ ] Show recent message thread previews
- [ ] Show child-level academic and administrative summaries (tuition, grades, school updates)
- [ ] Show pending appointment requests and confirmed appointments by department
- [ ] Show rotating notification banners/media in dashboard carousel

### Messaging
- [ ] Thread list for parent conversations
- [ ] Thread detail with paginated messages
- [ ] Compose/send message with optimistic UI and failure handling

### Announcements
- [ ] Announcements feed with date, audience, and priority metadata
- [ ] Announcement detail view

### Calendar & Appointments
- [ ] School events calendar view
- [ ] Appointment request flows for coordination and direction
- [ ] Guest/clerk tour-info appointment flow with approval email delivery

### Profile
- [x] Parent profile page (contact info + preferred language)
  - [x] Added GET/PATCH `/api/user/profile` endpoints for profile fetching and updating
  - [x] Added `UserProfileForm` component with edit/view modes and parent-specific fields
  - [x] Implemented profile pages for parent, staff, and superadmin dashboards
  - [x] Added i18n keys for profile form labels (fullName, email, phone, language, curp, rfc, profession, invoiceRequired, edit, save, cancel, etc.)
  - [x] Parent can view and edit: full name, phone, language, CURP, RFC, profession, invoice requirement
  - [x] Staff and superadmin can view and edit: full name, phone, language (no parent-specific fields)
- [ ] Child onboarding and child-profile editing flow for approved parents
- [ ] Parent upload flow for INE/passport and student-related authorization documents
- [ ] Authorized pickup-person management with add/remove controls and consent capture

### Payments & Records
- [ ] Payment history and upcoming tuition list by student
- [ ] Tuition pricing windows with date-aware amount options
- [ ] Unique tuition payment identifiers per student and billing period
- [ ] Manual payment instructions for transfer and bank deposit
- [ ] Grade and evaluation file viewer for uploaded PDFs

## Phase 5 — Companion App MVP (Operations)

### Superadmin Platform Dashboard
- [~] Global user directory with id, role, status, and search/filter controls (single-school scope)
  - [x] Added pending-status authorization modal from users directory with role assignment and approve action
  - [x] Added two-step parent-child transfer flow from parent profile modal (request + explicit confirmation phrase)
- [x] Add superadmin Dev tab for seeded email-account creation in QA environments
  - [x] Added superadmin Dev tool to reset password for existing email users by account email
- [ ] Activate/deactivate users and inspect role assignments
- [ ] Platform usage metrics and storage/database usage visibility
- [ ] Mailer template management for editing and creating email templates

### Staff Messaging Tools
- [ ] Staff inbox with filters (class/student/thread status)
- [ ] Reply workflows and status updates

### Announcement Management
- [ ] Staff/admin announcement creation
- [ ] Publish targeting (school-wide vs selected classes)
- [ ] Scheduled notification campaigns with audience targeting (`parents`, `staff`, `both`)
- [ ] Optional banner/image attachments for dashboard carousel placement

### User/Relationship Management
- [ ] Admin assignment flows for student ↔ guardian relationships
- [x] Basic role administration safeguards
  - [x] Enforced single active school membership role per profile in API reassignment/approval flows
  - [x] Added DB invariant migration to prevent multiple active role rows per profile
  - [x] Blocked lower-role actors from editing, deactivating, approving, or reassigning higher-role accounts
- [ ] School owner user-management panel for school staff role assignment
- [ ] Staff directory search with role-aware visibility and edit restrictions
- [ ] Parent approval queue and child-onboarding approval queue

### Student Operations
- [ ] Student record status board (documents complete, tuition standing, approvals)
- [ ] Document completeness tracking and required-paper checklist
- [ ] Teacher PDF uploads for grades and evaluations
- [ ] Appointment history and notes linked to related students
- [ ] Student identity/medical fields (`CURP`, grade, blood type, allergies, enrollment date)
- [ ] Authorized pickup-person review, verification, and incident-ready history

### Staff Records
- [ ] Staff profile requirements for coordination, direction, owner, clerk, and teacher (`name`, `mail`, `phone`, government id document)
- [ ] Teacher class-assignment management and directory visibility

### Scheduling & Payroll Support
- [ ] Appointment queue management with approval, cancelation, completion, and notes
- [ ] Open-hours configuration for appointment-generating departments

## Phase 6 — Post-MVP Extensions

### Teacher Scheduling & Payroll
- [ ] Teacher weekly/term schedule management by coordination
- [ ] Teacher compensation summaries from scheduled hours
- [ ] Receipt generation for weekly/bi-weekly/monthly teacher payments

### Direct Payments
- [ ] Evaluate Stripe vs Mercado Pago for school payment flows
- [ ] Add in-platform tuition payment checkout
- [ ] Add payment webhook reconciliation for direct online payments

## Cross-Cutting Access Control

- [ ] Enforce dashboard boundaries so users can only access their assigned dashboard area
- [ ] Add tests for role-based route authorization and redirects
- [ ] Enforce role-aware search/edit restrictions inside staff dashboard features
- [ ] Add audit logs for authorized pickup access changes and sensitive profile updates

## Phase 7 — Hardening & Release Readiness

- [ ] Error states and empty states reviewed for all companion routes
- [ ] Accessibility pass (keyboard + screen reader baseline)
- [ ] Performance baseline for dashboard and messaging screens
- [ ] Security review for RLS and API boundaries
- [ ] UAT checklist and launch readiness sign-off

---

## Decisions Log

| Decision | Choice | Reason |
|---|---|---|
| UI primitive layer | Build fresh, follow alchemist architecture | Same patterns, clean ownership, no cross-project coupling |
| Styling | Tailwind v4 | Matches existing setup |
| i18n | Custom (LocaleProvider + translate()) | Ported from alchemist, type-safe |
| Asset hosting (dev) | `/public` folder | Simplest for now |
| Asset hosting (prod) | Supabase Storage | Single platform with companion app |
| Deployment | Vercel or AWS | Decide at MVP — both compatible |
| Component naming | `App` prefix for UI primitives | Consistent with alchemist |

---

## Component Architecture

```
components/
  ui/              ← Pure primitives (built fresh, same architecture as alchemist)
                     AppButton, AppSectionLabel, AppSectionHeading,
                     AppCheckItem, AppContactInfoGroup, AppSocialLinks
  layout/          ← Shared layout wrappers
                     Navbar, Footer
  marketing/       ← Marketing-site composites (not reused in companion app)
                     HeroSection, ValuesGrid, BenefitCard, EnfoqueSection,
                     ProgramCard, TestimonialCard, LeadForm
lib/
  i18n.ts          ← resolveLocale, translate (ported from alchemist)
  i18n/messages/
    en-US.ts
    es-MX.ts
tests/
  components/      ← Component unit tests
  lib/             ← Utility unit tests
```
