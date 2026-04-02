# SQL Migration Plan

This document defines the recommended structure for the first Supabase/Postgres migration set for the Virtuós companion platform.

## Goals

- Create the minimum schema needed for MVP identity, school scoping, onboarding, files, notifications, appointments, messaging, and tuition tracking.
- Keep the first migration series understandable and reversible.
- Add RLS-compatible ownership and scope columns from the start.
- Avoid mixing post-MVP scheduling/payroll or direct-payment gateway work into the MVP schema baseline.

## Migration Strategy

Use multiple focused migrations, not one oversized file.

Recommended order:

1. foundational extensions, helper functions, and shared constraints
2. schools, profiles, memberships, and approval tables
3. students, guardians, pickup authorization, and class assignments
4. storage metadata and document/media tables
5. notifications and announcements
6. calendars, slots, appointments, and notes
7. messaging tables
8. tuition and payment tracking tables
9. indexes, triggers, and backfill helpers
10. RLS enablement and policies

## Recommended Initial Migration Set

### 001_foundations.sql

Purpose:
- enable required extensions
- add shared helper functions
- add timestamp trigger helpers

Recommended contents:
- `pgcrypto` for UUID generation if needed
- `moddatetime` or a custom `set_updated_at()` trigger helper
- helper functions such as:
  - `app.is_superadmin()`
  - `app.current_profile_id()`
  - `app.has_school_role(school_uuid uuid, roles text[])`
  - `app.is_linked_parent(student_uuid uuid)`

### 002_identity_and_schools.sql

Purpose:
- define school scoping and authenticated user metadata

Tables:
- `schools`
- `profiles`
- `parent_profiles`
- `staff_profiles`
- `school_memberships`
- `parent_approval_requests`

Key requirements:
- `profiles.id` maps to `auth.users.id`
- `school_memberships` stores school role + approval status
- unique constraints for one profile-per-extension table

### 003_students_and_relationships.sql

Purpose:
- define student records and parent/student operational relationships

Tables:
- `students`
- `student_guardians`
- `student_pickup_contacts`
- `student_pickup_authorizations`
- `student_pickup_audit_logs`
- `academic_classes`
- `teacher_class_assignments`

Key requirements:
- student onboarding approval fields
- parent linkage fields
- immutable-style audit records for pickup authorization changes

### 004_storage_metadata.sql

Purpose:
- store file metadata for private Supabase Storage objects

Tables:
- `identity_documents`
- `student_documents`
- `media_assets`

Bucket assumptions:
- `identity-documents`
- `student-files`
- `notification-media`

Key requirements:
- `storage_bucket`
- `storage_path`
- file kind/type metadata
- uploader and school linkage

### 005_notifications.sql

Purpose:
- define announcement and notification delivery model

Tables:
- `announcements`
- `notification_campaigns`
- `notification_deliveries`

Key requirements:
- separate campaign creation from recipient delivery state
- optional banner/image linkage through `media_assets`

### 006_calendars_and_appointments.sql

Purpose:
- define the shared scheduling engine for school events and appointment flows

Tables:
- `calendars`
- `calendar_events`
- `availability_rules`
- `appointment_slots`
- `guest_tour_requests`
- `appointments`
- `appointment_notes`

Key requirements:
- support school events + clerk/coordination/direction appointment surfaces
- support guest-origin and parent-origin appointments
- support student-linked appointment notes

### 007_messaging.sql

Purpose:
- define parent/staff communications

Tables:
- `threads`
- `thread_participants`
- `messages`

Key requirements:
- school scope on threads
- optional student linkage on threads
- participant-based access patterns

### 008_tuition_and_payments.sql

Purpose:
- define manual-first tuition tracking and reconciliation

Tables:
- `student_tuition_accounts`
- `tuition_periods`
- `tuition_quotes`
- `payment_records`

Key requirements:
- unique payment reference per quote
- date-window pricing support
- manual payment reconciliation for MVP

### 009_indexes_and_triggers.sql

Purpose:
- add high-signal indexes and `updated_at` triggers after core schema exists

Suggested indexes:
- school/role membership lookups
- student lookup by school + `CURP`
- appointment query indexes
- payment query indexes
- unread notification lookup indexes

### 010_rls_policies.sql

Purpose:
- enable RLS and create the first stable policy set

Reference:
- see `docs/RLS_POLICY_PLAN.md`

## Implementation Notes

### Enum Strategy

Prefer `text` columns with check constraints for initial migrations unless there is a very stable enum domain.

Reason:
- easier iterative changes during early product discovery
- less painful than altering many Postgres enums repeatedly

### Soft Deletion Strategy

Use status fields and audit records rather than hard deletes for sensitive entities:
- pickup contacts and authorization records
- identity documents
- parent approval workflows

### File Handling Strategy

- Store files in Supabase Storage.
- Store metadata only in SQL tables.
- Keep storage paths deterministic and school-scoped.

### Post-MVP Exclusions

Keep these out of the initial migration set unless scope changes:
- teacher scheduling/payroll settlement tables beyond minimal class assignment support
- direct Stripe/Mercado Pago checkout tables

## Ready-For-Code Outcome

When this plan is executed, the repo should contain:

1. a `supabase/migrations/` folder
2. focused numbered SQL files in the order above
3. RLS enabled on private tables
4. helper SQL functions used by policies
5. storage metadata tables aligned with Supabase Storage bucket usage