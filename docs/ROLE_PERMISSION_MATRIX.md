# Role Permission Matrix

This document is the implementation-facing source of truth for role capabilities in the Virtuós companion platform MVP.

## Permission Legend

| Value | Meaning |
|---|---|
| `none` | No access |
| `view` | Read-only access |
| `create` | Can create/request new records |
| `edit` | Can update records within allowed scope |
| `approve` | Can approve/reject records |
| `manage` | Full module-level control within allowed scope |

## Global Scope Rules

- `superadmin` is the only role with cross-school platform access.
- `school_owner`, `direction`, `coordination`, `teacher`, `clerk`, and `parent` are always scoped to their school membership.
- `student` is a non-login entity, not an authenticated actor.
- `guest` is a non-login public actor limited to the tour/info appointment flow.
- No school role can modify `superadmin`.
- Only `superadmin` can assign or change the `school_owner` role.
- Parents only access records for their linked students.
- Sensitive student notes, medical fields, and incident-related pickup data are visible only to appropriate staff roles and linked parents.

## Dashboard Routing

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| Access superadmin dashboard | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |
| Access staff dashboard | `view` | `manage` | `manage` | `manage` | `view` | `view` | `none` | `none` |
| Access parent dashboard | `none` | `none` | `none` | `none` | `none` | `none` | `manage` | `none` |
| Access guest calendar flow | `none` | `none` | `none` | `none` | `none` | `none` | `none` | `create` |

Notes:
- Staff dashboard access does not imply equal permissions inside the dashboard.
- Teachers and clerks use the same dashboard surface with narrower module permissions.

## User Directory And Role Administration

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View platform-wide user directory | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |
| View school user directory | `manage` | `manage` | `view` | `view` | `view` | `view` | `none` | `none` |
| Search/filter users by role/type/status | `manage` | `manage` | `view` | `view` | `view` | `view` | `none` | `none` |
| View user ids and audit metadata | `manage` | `view` | `view` | `view` | `none` | `none` | `none` | `none` |
| Activate/deactivate school users | `manage` | `manage` | `approve` | `none` | `none` | `none` | `none` | `none` |
| Assign/change `school_owner` | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |
| Assign/change `direction` | `manage` | `manage` | `none` | `none` | `none` | `none` | `none` | `none` |
| Assign/change `coordination` | `manage` | `manage` | `approve` | `none` | `none` | `none` | `none` | `none` |
| Assign/change `teacher` | `manage` | `manage` | `approve` | `approve` | `none` | `none` | `none` | `none` |
| Assign/change `clerk` | `manage` | `manage` | `approve` | `approve` | `none` | `none` | `none` | `none` |
| Assign/change `parent` | `manage` | `manage` | `approve` | `approve` | `none` | `none` | `none` | `none` |

Notes:
- `clerk` directory access is informational and must exclude privileged edits.
- `coordination` can manage teachers and parents but not `school_owner`.
- `direction` can participate in approvals but should not change `school_owner`.

## Parent Approval And Onboarding

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| Submit parent signup with Google | `none` | `none` | `none` | `none` | `none` | `none` | `create` | `none` |
| View parent approval queue | `manage` | `manage` | `approve` | `approve` | `none` | `view` | `none` | `none` |
| Approve/reject parent account | `manage` | `approve` | `approve` | `approve` | `none` | `none` | `none` | `none` |
| View approval notes | `manage` | `view` | `view` | `view` | `none` | `view` | `none` | `none` |
| Add internal approval notes | `manage` | `edit` | `edit` | `edit` | `none` | `none` | `none` | `none` |

## Parent Profile And Compliance Data

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View parent basic profile | `manage` | `manage` | `view` | `view` | `view` | `view` | `manage` | `none` |
| Edit parent basic profile | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `edit` | `none` |
| View parent sensitive fields (`CURP`, `RFC`, profession, invoice flag) | `manage` | `manage` | `view` | `view` | `none` | `none` | `manage` | `none` |
| Edit parent sensitive fields | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `edit` | `none` |
| Upload/view parent ID document | `manage` | `manage` | `view` | `view` | `none` | `view` | `edit` | `none` |

Notes:
- `clerk` access is limited to verification status plus general operational data such as phone number and authorized pickup people.

## Student Records And Enrollment

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| Create child/student record | `none` | `none` | `none` | `none` | `none` | `none` | `create` | `none` |
| View student record | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `none` |
| Edit student core profile | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `edit` | `none` |
| Approve/reject student onboarding | `manage` | `approve` | `approve` | `approve` | `none` | `view` | `none` | `none` |
| View student medical/admin fields (`blood_type`, `allergies`, enrollment data) | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `none` |
| Edit student medical/admin fields | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `edit` | `none` |

Notes:
- Parent edits are limited to their linked children.
- Teacher visibility is for teaching context, and teachers can view the full student record for now while teacher edit rights stay narrow.

## Pickup Authorization Management

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| Create authorized pickup contact | `none` | `none` | `none` | `none` | `none` | `none` | `create` | `none` |
| View pickup contacts | `manage` | `manage` | `view` | `view` | `view` | `view` | `manage` | `none` |
| Edit/revoke pickup contact | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `edit` | `none` |
| Upload/view pickup-contact ID | `manage` | `manage` | `view` | `view` | `none` | `view` | `edit` | `none` |
| Upload/view signed authorization evidence | `manage` | `manage` | `view` | `view` | `none` | `view` | `edit` | `none` |
| View pickup audit log | `manage` | `manage` | `view` | `view` | `none` | `view` | `view` | `none` |

Notes:
- Audit log entries are immutable.
- Parent can view the history for their own children but cannot erase it.

## Student Documents, Grades, And Evaluations

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View student document checklist | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `none` |
| Mark documents approved/rejected | `manage` | `approve` | `approve` | `approve` | `none` | `edit` | `none` | `none` |
| Upload grades/evaluation PDFs | `manage` | `manage` | `edit` | `edit` | `edit` | `none` | `none` | `none` |
| View grades/evaluation PDFs | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `none` |

Notes:
- Clerk document actions are operational, not academic.
- Parent access is limited to linked students' final records.

## Notifications And Announcements

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| Create school notification/announcement | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |
| Schedule future notification | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |
| Attach banner media | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |
| View delivered notifications | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `none` |
| Receive parent-targeted notifications | `none` | `none` | `none` | `none` | `none` | `none` | `view` | `none` |
| Receive staff-targeted notifications | `none` | `view` | `view` | `view` | `view` | `view` | `none` | `none` |

## Calendar And Appointments

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View school events calendar | `manage` | `manage` | `view` | `view` | `view` | `view` | `view` | `view` |
| Create/edit school events | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |
| Configure clerk tour calendar open hours | `manage` | `manage` | `edit` | `edit` | `none` | `edit` | `none` | `none` |
| Configure coordination calendar open hours | `manage` | `manage` | `edit` | `manage` | `none` | `none` | `none` | `none` |
| Configure direction calendar open hours | `manage` | `manage` | `manage` | `edit` | `none` | `none` | `none` | `none` |
| Request clerk/tour appointment | `none` | `none` | `none` | `none` | `none` | `none` | `none` | `create` |
| Request coordination/direction appointment | `none` | `none` | `none` | `none` | `none` | `none` | `create` | `none` |
| Create appointment request on behalf of parent | `manage` | `manage` | `edit` | `edit` | `none` | `edit` | `none` | `none` |
| View pending appointment requests | `manage` | `manage` | `view` | `view` | `none` | `view` | `view` | `view-own` |
| Approve/confirm/cancel appointments | `manage` | `manage` | `manage` | `manage` | `none` | `edit` | `edit-own` | `edit-own` |
| Add internal appointment notes | `manage` | `manage` | `edit` | `edit` | `view` | `edit` | `none` | `none` |
| Link appointment outcome to student record | `manage` | `manage` | `edit` | `edit` | `none` | `edit` | `none` | `none` |

Notes:
- `view-own` and `edit-own` mean access only to the actor's own request records.
- Guest appointment access remains isolated from the authenticated platform.
- Teachers can view full appointment history and notes for students within their allowed teaching scope.

## Messaging

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View staff-parent threads in school scope | `manage` | `manage` | `view` | `view` | `view` | `view` | `none` | `none` |
| Participate in assigned threads | `none` | `edit` | `edit` | `edit` | `edit` | `edit` | `edit` | `none` |
| Create new parent-staff thread | `none` | `edit` | `edit` | `edit` | `edit` | `edit` | `edit` | `none` |
| Close/reopen thread | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |

## Tuition And Payments

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View tuition periods and quotes | `manage` | `manage` | `view` | `view` | `none` | `view` | `view` | `none` |
| Configure tuition periods/pricing windows | `manage` | `manage` | `edit` | `edit` | `none` | `none` | `none` | `none` |
| View payment history | `manage` | `manage` | `view` | `view` | `none` | `view` | `view` | `none` |
| Mark tuition as paid | `manage` | `manage` | `edit` | `edit` | `none` | `edit` | `none` | `none` |
| View payment reference ids | `manage` | `manage` | `view` | `view` | `none` | `view` | `view` | `none` |
| View manual payment instructions | `none` | `none` | `none` | `none` | `none` | `none` | `view` | `none` |

## Platform Operations

| Capability | Superadmin | School Owner | Direction | Coordination | Teacher | Clerk | Parent | Guest |
|---|---|---|---|---|---|---|---|---|
| View DB/storage/platform usage | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |
| Edit/create mailer templates | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |
| View cross-school platform notifications | `manage` | `none` | `none` | `none` | `none` | `none` | `none` | `none` |

## Open Policy Decisions

No open MVP policy blockers remain.

Future refinement note:

- Coordination may later narrow teacher note visibility to academically relevant notes only if operational policy changes.