-- Virtuos Institute
-- Migration 018: Make parent_profiles.curp Optional
-- Purpose: CURP is only required for the student, not for the parent to be able
--          to register a child. Removing the NOT NULL constraint unblocks parents
--          who have not yet filled in their own profile from onboarding their children.

begin;

alter table public.parent_profiles
  alter column curp drop not null;

-- Drop the unique index that was defined on upper(curp) — it would reject NULLs
-- inconsistently across Postgres versions. Re-create it as a partial index so it
-- only enforces uniqueness when curp is actually provided.
drop index if exists parent_profiles_curp_unique_idx;

create unique index if not exists parent_profiles_curp_unique_idx
  on public.parent_profiles (upper(curp))
  where curp is not null;

commit;
