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
- [ ] Add app-managed mailer boundary following alchemist-style architecture (`lib/invite-mailer.ts` + template builders)
- [ ] Configure Supabase Storage private buckets (`identity-documents`, `student-files`, `notification-media`)
- [ ] Define deterministic storage path conventions by school, entity, and file kind
- [ ] Add typed Supabase browser/server clients in `lib/supabase/`
- [ ] Add route groups for authenticated app shell (`app/(app)/...`) while preserving static marketing routes
- [ ] Add protected-route middleware strategy for companion routes
- [ ] Add public guest calendar route (`app/(public)/tour-calendar`) with no-auth access and strict scope guard
- [ ] Add dashboard route shells:
  - `app/(app)/superadmin/**`
  - `app/(app)/staff/**`
  - `app/(app)/parent/**`
- [ ] Add role-to-dashboard resolver and post-login redirect policy

### Data & Auth Setup
- [x] Create initial schema migration (schools, profiles, school_memberships, parent_profiles, staff_profiles, identity_documents, parent_approval_requests, students, student_guardians, student_documents, student_pickup_contacts, student_pickup_authorizations, student_pickup_audit_logs, academic_classes, teacher_class_assignments, student_tuition_accounts, tuition_periods, tuition_quotes, payment_records, threads, thread_participants, messages, announcements, notification_campaigns, notification_deliveries, media_assets, calendars, calendar_events, availability_rules, appointment_slots, appointments, appointment_notes, guest_tour_requests)
- [x] Configure role model with platform role (`superadmin`) and school roles (`school_owner`, `direction`, `coordination`, `teacher`, `clerk`)
- [x] Add baseline RLS policies for superadmin/platform maintenance and school-scoped access boundaries
- [ ] Add storage metadata and signed-URL access flow for private files
- [ ] Add approval workflow: parent Google signup -> staff approval -> parent can register children -> staff approves child records
- [ ] Add required-field validation by role (parent, student, coordination/direction/owner, teacher)
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
- [ ] Parent profile page (contact info + preferred language)
- [ ] Child onboarding and child-profile editing flow for approved parents
- [ ] Parent billing and identity details (`CURP`, `RFC`, profession, invoice preference)
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
- [ ] Global user directory with id, role, school, status, and search filters
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
- [ ] Basic role administration safeguards
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
