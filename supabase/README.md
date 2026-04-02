# Supabase Scaffold

This folder holds Supabase migration and local-backend artifacts for the Virtuós companion platform.

## Current Status

- `migrations/` contains only active migrations that are eligible for `supabase db push`.
- `draft/` contains scaffold or parked migrations not ready to be applied.
- The migration sequence matches the planning in `docs/SQL_MIGRATION_PLAN.md`.
- RLS implementation guidance lives in `docs/RLS_POLICY_PLAN.md`.
- `migration-status.json` tracks whether each migration is still draft, ready to push, or blocked.

## Planned Migration Order

1. `001_foundations.sql`
2. `002_identity_and_schools.sql`
3. `003_students_and_relationships.sql`
4. `004_storage_metadata.sql`
5. `005_notifications.sql`
6. `006_calendars_and_appointments.sql`
7. `007_messaging.sql`
8. `008_tuition_and_payments.sql`
9. `009_indexes_and_triggers.sql`
10. `010_rls_policies.sql`

## Notes

- Buckets are expected to be managed in Supabase Storage, not in Vercel.
- Private storage buckets for MVP:
  - `identity-documents`
  - `student-files`
  - `notification-media`
- Do not mix post-MVP payroll or direct gateway-payment schema into the early migrations.
- Baseline Supabase CLI setup is initialized in this repo (`supabase/config.toml`, `supabase/seed.sql`).

## First-Time Setup

1. Copy env vars:
  - `cp .env.example .env.local`
  - fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
2. Local stack (requires Docker Desktop):
  - `npx supabase start`
3. Link to hosted project:
  - `npx supabase login`
  - `npx supabase link --project-ref <project-ref>`

## Migration Tracking

Use the tracker and helper script before applying any migration:

1. Check status:
  - `npm run supabase:migrations:status`
2. Mark a migration ready:
  - `npm run supabase:migrations -- ready 001 "Foundations reviewed"`
3. Mark a migration blocked:
  - `npm run supabase:migrations -- blocked 004 "Waiting on storage policy change"`
4. Check whether a push is safe:
  - `npm run supabase:migrations -- check-push --env=local`
  - `npm run supabase:migrations -- check-push --env=linked`

## Push Workflow

Supabase CLI applies all pending migrations in `supabase/migrations`. It does not provide a first-class “push only this exact migration” workflow.

Recommended workflow:

1. Keep unfinished migrations in `supabase/draft`.
2. Move only reviewed migrations into `supabase/migrations`.
3. Mark active migrations as `ready`.
4. Use the guarded push scripts:
  - `npm run supabase:db:push:local`
  - `npm run supabase:db:push:linked`
5. After a successful apply, mark the migration state:
  - `npm run supabase:migrations -- mark-local 001 applied`
  - `npm run supabase:migrations -- mark-linked 001 applied`

Current folder split:

- `supabase/migrations`: `001` through `010` (all implemented)
- `supabase/draft`: empty

Dry-run commands are also available:

- `npm run supabase:db:push:local:dry-run`
- `npm run supabase:db:push:linked:dry-run`