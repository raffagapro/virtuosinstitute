-- Virtuos Institute
-- Migration 013: Drop school_id Columns And schools Table
-- Purpose: complete single-school refactor by removing remaining school-scoped columns and tenant table.

begin;

do $$
declare
  col_row record;
begin
  -- Drop every school_id column in public schema tables.
  -- CASCADE ensures dependent indexes, constraints, and policies are removed.
  for col_row in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'school_id'
  loop
    execute format(
      'alter table public.%I drop column if exists school_id cascade',
      col_row.table_name
    );
  end loop;
end $$;

-- Single-school mode no longer needs tenant table.
drop table if exists public.schools cascade;

-- Remove obsolete school-scoped helper functions.
drop function if exists app.can_access_school(uuid);
drop function if exists app.has_any_school_membership(uuid);
drop function if exists app.has_school_role(uuid, text[]);
drop function if exists app.has_school_management_role(uuid);
drop function if exists app.has_school_staff_role(uuid);

commit;
