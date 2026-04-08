# Data Model

> Phase 1 (Marketing site) has no database. This document will grow as the companion app schema is defined in Phase 3.

---

## Phase 1 — No Database

The marketing site is fully static. The lead/enrollment form will submit to an external service (TBD: API route + email provider, or Formspree). No tables required.

---

## Phase 3+ — Companion App (Initial Draft)

This draft defines the first implementation baseline for the parent/staff companion app.

### Auth Provider

- Authentication is handled through Google OAuth (via Supabase Auth provider configuration).
- User role/permissions are managed in app tables and RLS policies.
- Students are not auth users and do not have login credentials.

### File Storage Decision

- File binaries are stored in Supabase Storage buckets, not in Postgres rows.
- MVP buckets:
	- `identity-documents`
	- `student-files`
	- `notification-media`
- Database tables store file metadata, ownership, and permission-relevant references.
- All buckets are private in MVP; access should be mediated by signed URLs after permission checks.
- Storage paths should be deterministic and entity-scoped.
- Path convention examples:
	- `identity-documents/parents/{profileId}/{documentType}/{fileId}.{ext}`
	- `identity-documents/staff/{profileId}/{documentType}/{fileId}.{ext}`
	- `identity-documents/students/{studentId}/pickup/{pickupContactId}/{fileId}.{ext}`
	- `student-files/students/{studentId}/documents/{fileId}.{ext}`
	- `student-files/students/{studentId}/grades/{fileId}.pdf`
	- `student-files/students/{studentId}/evaluations/{fileId}.pdf`
	- `notification-media/campaigns/{campaignId}/{fileId}.{ext}`

### Role Model

- Platform role:
	- `superadmin`
- Operational roles:
	- `school_owner`
	- `direction`
	- `coordination`
	- `teacher`
	- `clerk`
	- `parent`
	- `student` (entity role only, no auth login)
	- `guest` (non-login calendar requester)

### Core Tables

#### `profiles`
User profile mapped to Supabase auth users.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Equals `auth.users.id` |
| `full_name` | `text` | Display name |
| `email` | `text` nullable | Mirror of auth email for querying/reporting |
| `platform_role` | `text` nullable | `superadmin` or `null` |
| `phone` | `text` nullable | Optional contact field |
| `date_of_birth` | `date` nullable | Shared birth date editable by authenticated roles |
| `preferred_locale` | `text` | `es-MX` or `en-US` |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `parent_profiles`
Parent-only fields layered on top of the shared profile table.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` PK/FK -> `profiles.id` | Parent profile |
| `curp` | `text` | Required |
| `rfc` | `text` nullable | Required only if invoicing is requested |
| `invoice_required` | `boolean` | Default `false` |
| `profession` | `text` nullable | Parent profession |
| `government_id_document_id` | `uuid` FK -> `identity_documents.id` nullable | INE/passport |
| `date_of_birth` | `date` nullable | Parent date of birth |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `staff_profiles`
Staff-only identity/compliance fields layered on top of the shared profile table.

| Column | Type | Notes |
|---|---|---|
| `profile_id` | `uuid` PK/FK -> `profiles.id` | Staff profile |
| `government_id_document_id` | `uuid` FK -> `identity_documents.id` nullable | INE/passport |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `identity_documents`
Metadata for identity-proof files attached to parents, staff, and authorized pickup contacts.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Document id |
| `storage_bucket` | `text` | Expected: `identity-documents` |
| `document_type` | `text` | `ine`, `passport`, `pickup_id`, `signed_authorization` |
| `storage_path` | `text` | Object storage path |
| `mime_type` | `text` | Content type |
| `byte_size` | `bigint` | File size |
| `uploaded_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Uploader |
| `created_at` | `timestamptz` | Default `now()` |

#### `school_memberships`
Maps user profiles to role assignments in global single-school mode.

- Invariant: each profile can have only one active school membership at a time (`is_active = true`). Historical membership rows are preserved as inactive records.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Membership id |
| `profile_id` | `uuid` FK -> `profiles.id` | Required |
| `school_role` | `text` | `school_owner`, `direction`, `coordination`, `teacher`, `clerk`, `parent`, `student`, `guest` |
| `is_active` | `boolean` | Default `true` |
| `approval_status` | `text` | `pending`, `approved`, `rejected`, `suspended` |
| `created_at` | `timestamptz` | Default `now()` |

#### `parent_approval_requests`
Tracks parent onboarding/approval review state and reviewer actions.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Request id |
| `profile_id` | `uuid` FK -> `profiles.id` | Parent profile |
| `status` | `text` | `pending`, `approved`, `rejected`, `suspended` |
| `reviewed_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff reviewer |
| `reviewed_at` | `timestamptz` nullable | Review timestamp |
| `notes` | `text` nullable | Internal review notes |
| `created_at` | `timestamptz` | Default `now()` |

#### `students`
Student records managed by parents/staff/admin. Students do not authenticate directly.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Student id |
| `created_by_parent_profile_id` | `uuid` FK -> `profiles.id` nullable | Parent who submitted student registration |
| `approval_status` | `text` | `pending`, `approved`, `rejected`, `archived` |
| `approved_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff approver |
| `approved_at` | `timestamptz` nullable | Approval timestamp |
| `first_name` | `text` | Required |
| `last_name` | `text` | Required |
| `curp` | `text` nullable | Required for enrolled student record completion |
| `grade_level` | `text` | Example: `kinder`, `primaria-1` |
| `blood_type` | `text` nullable | Example: `O+` |
| `allergies` | `text` nullable | Medical notes |
| `enrollment_date` | `date` nullable | Fecha de inscripcion |
| `is_active` | `boolean` | Default `true` |
| `date_of_birth` | `date` nullable | Student date of birth |
| `data_authorization_signed_at` | `timestamptz` nullable | Timestamp of signed data-use authorization |
| `data_authorization_signed_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff member who recorded the authorization |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `student_guardians`
Join table between parents and students.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Relationship id |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `parent_profile_id` | `uuid` FK -> `parent_profiles.profile_id` | Parent profile |
| `relationship_type` | `text` | Example: `mother`, `father`, `tutor` |
| `is_primary_contact` | `boolean` | Default `false` |
| `is_legal_guardian` | `boolean` | Default `false` |
| `link_status` | `text` | `pending`, `approved`, `rejected`, `revoked` |
| `approved_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff/superadmin approver |
| `approved_at` | `timestamptz` nullable | Approval timestamp |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `parent_child_transfer_requests`
Audited two-step parent transfer workflow before moving student guardian links.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Transfer request id |
| `source_parent_profile_id` | `uuid` FK -> `profiles.id` | Current parent account |
| `target_parent_profile_id` | `uuid` FK -> `profiles.id` | New parent account |
| `student_ids` | `uuid[]` | One or more selected students |
| `status` | `text` | `pending_confirmation`, `confirmed`, `cancelled`, `rejected` |
| `initiated_by_profile_id` | `uuid` FK -> `profiles.id` | Actor that created the request |
| `confirmed_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Actor that confirmed transfer |
| `contacted_current_parent` | `boolean` | Contact log flag |
| `contacted_target_parent` | `boolean` | Contact log flag |
| `communication_notes` | `text` nullable | Notes about outreach/verification |
| `confirmed_at` | `timestamptz` nullable | Confirmation timestamp |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `student_documents`
Tracks required/received enrollment documents for each student.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Document record id |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `document_type` | `text` | Example: birth certificate, CURP, photo |
| `status` | `text` | `missing`, `submitted`, `approved`, `rejected` |
| `storage_path` | `text` nullable | File location if uploaded |
| `reviewed_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Reviewer |
| `reviewed_at` | `timestamptz` nullable | Review timestamp |
| `created_at` | `timestamptz` | Default `now()` |

#### `student_pickup_contacts`
People authorized by parents to pick up a student.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Contact id |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `full_name` | `text` | Required |
| `relationship` | `text` nullable | Example: grandmother, uncle, nanny |
| `phone` | `text` nullable | Optional contact info |
| `id_document_id` | `uuid` FK -> `identity_documents.id` nullable | Required for activation |
| `status` | `text` | `pending`, `active`, `revoked` |
| `created_by_parent_profile_id` | `uuid` FK -> `profiles.id` | Parent actor |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `student_pickup_authorizations`
Parent consent artifacts for pickup authorization.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Authorization id |
| `student_pickup_contact_id` | `uuid` FK -> `student_pickup_contacts.id` | Required |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `parent_profile_id` | `uuid` FK -> `profiles.id` | Parent granting authorization |
| `authorization_document_id` | `uuid` FK -> `identity_documents.id` nullable | Signed authorization file |
| `consent_text_version` | `text` nullable | Version of digital agreement text |
| `authorized_at` | `timestamptz` | Consent timestamp |
| `revoked_at` | `timestamptz` nullable | Revocation timestamp |
| `created_at` | `timestamptz` | Default `now()` |

#### `student_pickup_audit_logs`
Immutable audit trail for pickup-authorization changes.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Audit id |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `student_pickup_contact_id` | `uuid` FK -> `student_pickup_contacts.id` | Required |
| `actor_profile_id` | `uuid` FK -> `profiles.id` nullable | Parent or staff actor |
| `action` | `text` | `created`, `updated`, `activated`, `revoked`, `deleted_attempted` |
| `reason` | `text` nullable | Optional justification |
| `metadata_json` | `jsonb` | Before/after snapshot data |
| `created_at` | `timestamptz` | Default `now()` |

#### `academic_classes`
Class catalog used for student grouping and teacher assignments.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Class id |
| `name` | `text` | Example: `1A Primaria` |
| `grade_level` | `text` | Normalized grade label |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

#### `teacher_class_assignments`
Teacher-to-class assignments.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Assignment id |
| `teacher_profile_id` | `uuid` FK -> `profiles.id` | Required |
| `class_id` | `uuid` FK -> `academic_classes.id` | Required |
| `subject_name` | `text` nullable | Optional subject dimension |
| `starts_on` | `date` nullable | Optional effective start |
| `ends_on` | `date` nullable | Optional effective end |
| `created_at` | `timestamptz` | Default `now()` |

#### `threads`
Conversation container for parent ↔ staff communication.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Thread id |
| `student_id` | `uuid` FK -> `students.id` nullable | Optional student context |
| `subject` | `text` | Thread subject |
| `status` | `text` | `open`, `closed` |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Creator |
| `created_at` | `timestamptz` | Default `now()` |
| `updated_at` | `timestamptz` | Updated by trigger |

#### `thread_participants`
Explicit participants for each thread.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Membership id |
| `thread_id` | `uuid` FK -> `threads.id` | Required |
| `profile_id` | `uuid` FK -> `profiles.id` | Required |
| `participant_role` | `text` | Snapshot role at join time |
| `created_at` | `timestamptz` | Default `now()` |

#### `messages`
Message items belonging to a thread.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Message id |
| `thread_id` | `uuid` FK -> `threads.id` | Required |
| `sender_profile_id` | `uuid` FK -> `profiles.id` | Required |
| `body` | `text` | Message content |
| `created_at` | `timestamptz` | Default `now()` |

#### `announcements`
Broadcast communication from staff/admin.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Announcement id |
| `title` | `text` | Required |
| `body` | `text` | Required |
| `audience` | `text` | `school`, `grade`, `student-list` |
| `audience_ref` | `text` nullable | Optional target identifier |
| `priority` | `text` | `normal`, `high` |
| `published_by_profile_id` | `uuid` FK -> `profiles.id` | Publisher |
| `published_at` | `timestamptz` | Publish datetime |
| `created_at` | `timestamptz` | Default `now()` |

#### `notification_campaigns`
Staff-created notification campaigns that may deliver email and/or in-app content.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Campaign id |
| `title` | `text` | Internal/admin title |
| `subject` | `text` nullable | Email subject if applicable |
| `body` | `text` | Campaign content |
| `target_audience` | `text` | `parents`, `staff`, `both` |
| `delivery_mode` | `text` | `immediate`, `scheduled` |
| `scheduled_for` | `timestamptz` nullable | Future send time |
| `banner_media_asset_id` | `uuid` FK -> `media_assets.id` nullable | Optional dashboard banner |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Creator |
| `created_at` | `timestamptz` | Default `now()` |

#### `notification_deliveries`
Per-recipient delivery state for notification campaigns.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Delivery id |
| `campaign_id` | `uuid` FK -> `notification_campaigns.id` | Required |
| `profile_id` | `uuid` FK -> `profiles.id` | Recipient |
| `email_status` | `text` | `pending`, `sent`, `failed`, `skipped` |
| `in_app_status` | `text` | `unread`, `read`, `hidden` |
| `delivered_at` | `timestamptz` nullable | Delivery timestamp |
| `created_at` | `timestamptz` | Default `now()` |

#### `media_assets`
Metadata for stored images/PDFs used by notifications, evaluations, and similar features.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Asset id |
| `storage_bucket` | `text` | Expected: `student-files` or `notification-media` |
| `kind` | `text` | `banner_image`, `grade_pdf`, `evaluation_pdf`, `document_upload` |
| `storage_path` | `text` | Object storage path |
| `mime_type` | `text` | Content type |
| `byte_size` | `bigint` | File size |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Uploader |
| `created_at` | `timestamptz` | Default `now()` |

#### `calendars`
Logical calendars/resources within the shared scheduling engine.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Calendar id |
| `calendar_type` | `text` | `school_events`, `clerk_appointments`, `coordination_appointments`, `direction_appointments`, `teacher_schedule` |
| `title` | `text` | Display name |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

#### `calendar_events`
General events shown on calendar surfaces.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Event id |
| `calendar_id` | `uuid` FK -> `calendars.id` | Required |
| `title` | `text` | Event title |
| `description` | `text` nullable | Optional details |
| `event_type` | `text` | `school_event`, `student_birthday`, `staff_birthday`, `teacher_shift`, `important_date` |
| `related_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff/parent whose birthday this represents |
| `related_student_id` | `uuid` FK -> `students.id` nullable | Student whose birthday this represents |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Creator (null for auto-generated events) |
| `created_at` | `timestamptz` | Default `now()` |

#### `availability_rules`
Recurring open-hours rules used to generate appointment slots.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Rule id |
| `calendar_id` | `uuid` FK -> `calendars.id` | Appointment-capable calendar |
| `weekday` | `int` | 0-6 or 1-7 by implementation choice |
| `start_time` | `time` | Required |
| `end_time` | `time` | Required |
| `slot_minutes` | `int` | `30` or `60` (slot duration in minutes) |
| `effective_from` | `date` | Required |
| `effective_to` | `date` nullable | Optional end date |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Creator |
| `created_at` | `timestamptz` | Default `now()` |

#### `appointment_slots`
Generated bookable slots for appointment calendars. When a slot is booked or covered by a `calendar_block`, its status is updated immediately to prevent double booking.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Slot id |
| `calendar_id` | `uuid` FK -> `calendars.id` | Required |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `status` | `text` | `available`, `held`, `booked`, `blocked` |
| `booked_by_appointment_id` | `uuid` FK -> `appointments.id` nullable | Set when status moves to `booked` |
| `created_at` | `timestamptz` | Default `now()` |

#### `calendar_blocks`
Manually blocked time ranges on a calendar (holidays, internal meetings, unavailability). Any `appointment_slots` that overlap a block are automatically marked `blocked`.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Block id |
| `calendar_id` | `uuid` FK -> `calendars.id` | Required |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `reason` | `text` nullable | Optional label shown to calendar owner |
| `created_by_profile_id` | `uuid` FK -> `profiles.id` | Creator |
| `created_at` | `timestamptz` | Default `now()` |

#### `appointments`
Booked appointments between family/guests and school departments.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Appointment id |
| `calendar_id` | `uuid` FK -> `calendars.id` | Required |
| `slot_id` | `uuid` FK -> `appointment_slots.id` nullable | Slot locked on booking |
| `requester_profile_id` | `uuid` FK -> `profiles.id` nullable | Parent/staff requester |
| `guest_request_id` | `uuid` FK -> `guest_tour_requests.id` nullable | Guest-origin request |
| `student_id` | `uuid` FK -> `students.id` nullable | Optional student this appointment relates to |
| `status` | `text` | `requested`, `confirmed`, `completed`, `canceled`, `no_show` |
| `requested_by_role` | `text` | `guest`, `parent`, `staff` |
| `reason` | `text` nullable | Note submitted by parent or guest at booking time |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `reminder_sent_at` | `timestamptz` nullable | Set when day-of reminder email is delivered |
| `created_at` | `timestamptz` | Default `now()` |

#### `appointment_notes`
Internal record of appointment outcomes and resolution notes. If the appointment is linked to a student, this note becomes part of the student school record. Notes are staff-internal and not visible to parents.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Note id |
| `appointment_id` | `uuid` FK -> `appointments.id` | Required |
| `author_profile_id` | `uuid` FK -> `profiles.id` | Staff author |
| `outcome` | `text` nullable | `completed`, `no_show`, `rescheduled`, `canceled` |
| `note_body` | `text` | Internal note text |
| `linked_student_id` | `uuid` FK -> `students.id` nullable | Set when note is relevant to a specific student record |
| `created_at` | `timestamptz` | Default `now()` |

#### `teacher_schedule_blocks`
Structured teacher schedule assignments for payroll and weekly planning.

After MVP: keep out of the initial migration unless teacher scheduling is pulled forward.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Schedule block id |
| `teacher_profile_id` | `uuid` FK -> `profiles.id` | Teacher |
| `calendar_event_id` | `uuid` FK -> `calendar_events.id` nullable | Linked event if modeled on teacher calendar |
| `starts_at` | `timestamptz` | Required |
| `ends_at` | `timestamptz` | Required |
| `pay_rate_snapshot` | `numeric` nullable | Optional pay-rate snapshot |
| `created_at` | `timestamptz` | Default `now()` |

#### `student_tuition_accounts`
Per-student tuition billing configuration.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Account id |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `billing_frequency` | `text` | `monthly` initially |
| `is_active` | `boolean` | Default `true` |
| `created_at` | `timestamptz` | Default `now()` |

#### `tuition_periods`
Billing periods for a student's tuition account.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Period id |
| `tuition_account_id` | `uuid` FK -> `student_tuition_accounts.id` | Required |
| `period_label` | `text` | Example: `2026-09` |
| `due_date` | `date` | Required |
| `status` | `text` | `open`, `paid`, `overdue`, `canceled` |
| `created_at` | `timestamptz` | Default `now()` |

#### `tuition_quotes`
Date-sensitive payable amounts for a tuition period.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Quote id |
| `tuition_period_id` | `uuid` FK -> `tuition_periods.id` | Required |
| `quote_type` | `text` | `early`, `mid`, `standard`, `late_fee` |
| `valid_from` | `date` | Required |
| `valid_to` | `date` | Required |
| `amount` | `numeric` | Required |
| `payment_reference` | `text` unique | Unique staff/parent reconciliation id |
| `created_at` | `timestamptz` | Default `now()` |

#### `payment_records`
Recorded payments or manual reconciliations against tuition quotes.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Payment record id |
| `tuition_quote_id` | `uuid` FK -> `tuition_quotes.id` | Required |
| `student_id` | `uuid` FK -> `students.id` | Required |
| `payment_method` | `text` | `transfer`, `deposit`, `cash`, `stripe`, `mercado_pago` |
| `status` | `text` | `pending`, `paid`, `failed`, `canceled` |
| `paid_at` | `timestamptz` nullable | Payment timestamp |
| `recorded_by_profile_id` | `uuid` FK -> `profiles.id` nullable | Staff recorder for manual payments |
| `external_reference` | `text` nullable | Transfer/deposit reference |
| `created_at` | `timestamptz` | Default `now()` |

MVP note:
- `payment_records` supports manual reconciliation first (`transfer`, `deposit`, `cash`).
- Direct gateway methods (`stripe`, `mercado_pago`) are after-MVP extensions.

#### `guest_tour_requests`
Public (non-auth) tour/info requests submitted through the guest/clerk calendar flow. Clerk reviews and confirms/rejects via the clerk appointment calendar.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Request id |
| `requested_datetime` | `timestamptz` | Requested tour/meeting time |
| `parent_name` | `text` | Requester name |
| `contact_email` | `text` | Contact channel |
| `contact_phone` | `text` nullable | Optional contact channel |
| `notes` | `text` nullable | Extra context |
| `status` | `text` | `requested`, `confirmed`, `completed`, `canceled` |
| `grade_of_interest` | `text` nullable | Grade level the prospect is interested in (e.g. `kinder`, `primaria-1`) |
| `created_at` | `timestamptz` | Default `now()` |

### Access Rules (RLS Baseline)

- Superadmin has full platform maintenance operations.
- Access is scoped by active role assignments and linked domain entities.
- School owner has full control of operational users, assignments, and content.
- Direction/coordination can manage operational and communication scopes defined by policy.
- Teachers and clerks can read/write only within assigned student/class/work scopes.
- Clerk user-directory access is directory-style and excludes privileged-role modification.
- Coordination can manage teachers, students, and parents, but not school owner or superadmin roles.
- Parents can read only student links, threads, and messages where they are participants and linked guardians.
- Parent-only PII (`CURP`, `RFC`, identity docs) is restricted to authorized staff roles plus the owning parent.
- Students do not sign in; all student-related data visibility is mediated through approved parent accounts.
- Student medical fields, pickup authorizations, and incident-sensitive records are restricted to appropriate school staff roles and linked parents.
- Guests do not sign in and can only submit/view their own public calendar tour/info requests.
- Guest flows cannot access parent/student messaging, tuition, grades, or any enrolled-family records.
- Announcements are readable if the current profile matches the target audience.
- Appointment notes linked to students are visible only to appropriate school staff roles.

### Migration Notes

- Add unique constraints:
	- `school_memberships(profile_id, school_role)`
	- `parent_profiles(profile_id)`
	- `staff_profiles(profile_id)`
	- `student_guardians(student_id, guardian_profile_id)`
	- `thread_participants(thread_id, profile_id)`
	- `teacher_class_assignments(teacher_profile_id, class_id, subject_name)`
	- `tuition_quotes(payment_reference)`
	- `appointment_slots(calendar_id, starts_at)` — prevents duplicate slot generation
- Add indexes:
	- `school_memberships(profile_id, school_role)`
	- `students(curp)`
	- `student_pickup_contacts(student_id, status)`
	- `student_pickup_audit_logs(student_id, created_at)`
	- `messages(thread_id, created_at)`
	- `threads(student_id, updated_at)`
	- `announcements(published_at desc)`
	- `guest_tour_requests(requested_datetime)`
	- `appointments(status, starts_at)`
	- `appointments(student_id)` — for student record lookups
	- `appointment_slots(calendar_id, status, starts_at)` — for open-slot queries
	- `calendar_blocks(calendar_id, starts_at, ends_at)` — for overlap detection
	- `payment_records(student_id, status, paid_at)`
	- `notification_deliveries(profile_id, in_app_status)`
- Add trigger function to maintain `updated_at` on mutable tables.

---

## TypeScript Types

Shared contracts live in `types/`. When Supabase is introduced, generated types (`types/database.types.ts`) will be the source of truth for table shapes.
