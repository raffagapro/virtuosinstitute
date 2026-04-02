# RLS Policy Plan

This document defines the first Row Level Security policy plan for the Virtuós companion platform MVP.

## What RLS Does

RLS controls which rows a logged-in user can read, insert, update, or delete at the database level.

For this project, RLS is responsible for enforcing:

- cross-school isolation
- parent-to-child linkage rules
- role-aware staff access
- protection of sensitive identity, medical, payment, and authorization records

## Policy Design Principles

1. Default deny on all private tables.
2. Enable RLS table by table after ownership/scope columns exist.
3. Express school scope through membership lookups, not client-supplied school ids alone.
4. Keep policy logic small by relying on helper SQL functions.
5. Use server-side service-role operations only for explicit internal/admin workflows.

## Recommended SQL Helper Functions

These should be created before policies are added.

### Identity Helpers

- `app.current_profile_id()`
  - Returns `auth.uid()`.
- `app.is_superadmin()`
  - Checks whether current profile has platform role `superadmin`.

### School Role Helpers

- `app.has_school_role(school_uuid uuid, roles text[])`
  - True if current user has an active, approved membership for the given school and one of the given roles.
- `app.has_any_school_membership(school_uuid uuid)`
  - True if current user belongs to the school.

### Parent/Student Relationship Helpers

- `app.is_linked_parent(student_uuid uuid)`
  - True if current user is an active linked guardian for the student.
- `app.can_access_student_sensitive_data(student_uuid uuid)`
  - True for allowed staff roles and linked parent.

### Appointment Helpers

- `app.can_manage_appointment_calendar(calendar_uuid uuid)`
  - True for authorized department roles.
- `app.can_view_appointment(appointment_uuid uuid)`
  - True for allowed staff, linked parent, or own guest request context where applicable.

## Table Policy Plan

### `schools`

Read:
- `superadmin`: all rows
- school members: own school row

Write:
- `superadmin` only

### `profiles`

Read:
- `superadmin`: all
- school staff: own-school visible users only
- parent: own row only

Write:
- self-update for safe profile fields only via app logic
- privileged role changes only through admin workflows

Note:
- role-changing actions should usually go through server actions, not direct client updates.

### `parent_profiles`

Read:
- owning parent
- `superadmin`
- `school_owner`, `direction`, `coordination`
- `clerk` should not read sensitive parent fields directly; clerk-facing flows should expose only verification status and general operational fields

Write:
- owning parent for own data
- privileged staff roles for review/correction workflows

### `staff_profiles`

Read:
- own row
- `superadmin`
- `school_owner`
- limited school management roles when operationally required

Write:
- own row for safe fields through app logic
- privileged staff management by `superadmin` or `school_owner`

### `school_memberships`

Read:
- `superadmin`: all
- `school_owner`: all rows in own school
- school management roles: school rows as needed
- parent: own membership rows only

Write:
- `superadmin` for owner assignment and platform-level control
- `school_owner` for school-side role assignments except owner/superadmin
- `direction` may approve broader school workflows than `coordination`
- `coordination` can approve within delegated operational scope but remains below `direction`

### `parent_approval_requests`

Read:
- `superadmin`
- `school_owner`, `direction`, `coordination`
- `clerk` read-only if operational review is desired
- parent can read own request only if needed by UX

Write:
- parent creates own request
- approver roles update status and notes

### `students`

Read:
- `superadmin`
- allowed school staff in same school
- linked parents only

Write:
- linked parent can create/edit own child onboarding rows before approval rules block certain edits
- `school_owner`, `direction`, `coordination` can approve and edit
- restricted staff edit scope by role

Additional rule:
- teachers may read the full student record for students within their allowed teaching scope

### `student_guardians`

Read:
- `superadmin`
- allowed school staff in same school
- linked parent for own relationships

Write:
- parent creates own child linkage through app flow
- management roles can review/adjust linkage

### `student_documents`

Read:
- linked parent for own child
- allowed school staff in same school

Write:
- parent may upload required docs for own child
- staff approval roles update document status

### `identity_documents`

Read:
- highly restricted
- owning parent or owning staff member for own records
- `superadmin`, `school_owner`, `direction`, `coordination`
- possibly `clerk` for verification-only contexts if approved by policy

Write:
- owner upload through app flow
- management roles for verification metadata only

### `student_pickup_contacts`

Read:
- linked parent
- allowed school staff in same school

Write:
- linked parent creates/edits/revokes
- management roles can review or restrict records in incident workflows

### `student_pickup_authorizations`

Read:
- linked parent
- allowed school staff in same school

Write:
- linked parent creates/revokes
- staff may append review state if modeled

### `student_pickup_audit_logs`

Read:
- `superadmin`
- school management roles in same school
- linked parent for full own-child history

Write:
- insert-only through app workflow or trigger
- no ordinary updates/deletes

### `academic_classes` and `teacher_class_assignments`

Read:
- same-school staff with operational need
- parents only if needed indirectly through student context, not as direct management data

Write:
- `school_owner`, `direction`, `coordination`

### `announcements`, `notification_campaigns`, `notification_deliveries`

Read:
- recipients only for delivery rows
- same-school staff for management rows
- linked parents only for parent-targeted content

Write:
- `school_owner`, `direction`, `coordination`
- `superadmin` for platform-level operational support if necessary

### `media_assets`

Read:
- depends on referenced feature
- notification banners may be readable by target audience
- student/private files only by allowed staff or linked parents

Write:
- feature-specific creator roles
- uploads should be mediated through server-side logic that validates owner/scope

### `calendars`, `calendar_events`, `availability_rules`, `appointment_slots`

Read:
- school members and guests only where the calendar is intentionally public

Write:
- `school_owner`, `direction`, `coordination`
- `clerk` only for clerk appointment-calendar operational scope

### `guest_tour_requests`

Read:
- request owner context only through app token/session pattern if supported
- `superadmin`, `school_owner`, `direction`, `coordination`, `clerk` in school scope

Write:
- public create
- management roles update status/confirmation

Important:
- public insert must be tightly constrained to only the guest appointment fields.

### `appointments` and `appointment_notes`

Read:
- allowed staff in school scope
- linked parent for own appointments
- guest only for own appointment lifecycle if guest request tracking exposes it

Additional rule:
- teachers may read full appointment history and notes for students within their allowed teaching scope
- this may be narrowed in the future by school policy, but MVP should allow full teacher visibility

Write:
- parents and guests create own requests through constrained flows
- staff approve/confirm/cancel/manage notes
- appointment notes should be hidden from parents and guests unless explicitly split into a separate public note field

### `threads`, `thread_participants`, `messages`

Read:
- participant-based access only
- plus `superadmin` for support/debug access where platform maintenance requires issue reproduction

Write:
- participants can add messages
- school management roles can close/reopen threads where policy allows

### `student_tuition_accounts`, `tuition_periods`, `tuition_quotes`, `payment_records`

Read:
- linked parents for own children
- allowed staff in same school
- `superadmin` for support/debug access where platform maintenance requires issue reproduction

Write:
- management roles configure periods and quotes
- clerk/direction/coordination mark manual payments paid according to policy
- parents do not directly mutate payment records in MVP

## Storage Access Pattern

Storage access should not rely on bucket rules alone.

Recommended pattern:

1. RLS protects metadata rows in `identity_documents`, `student_documents`, and `media_assets`.
2. Application checks DB permission first.
3. Server returns a signed URL for the requested object only if the metadata row is accessible.

## Superadmin Support Access

- `superadmin` is a platform maintenance/support role, not a normal school operator.
- `superadmin` must retain broad read/debug capability across school data so support can reproduce bugs and inspect state.
- Prefer explicit support/admin flows for write operations rather than routine school-operation permissions.

## Public vs Private Tables

Public-facing insert candidates:
- `guest_tour_requests`

Private tables with RLS required:
- everything else in the MVP app domain

## Ready-For-Code Outcome

Before writing the actual SQL policies, confirm:

1. exact helper function names and schema namespace

After that, the first policy implementation can be written table by table without redesigning the schema.