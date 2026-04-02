-- Virtuos Institute
-- Migration 012: Detach Schools Foreign Keys
-- Purpose: remove table-level references to public.schools across all public tables.

begin;

do $$
declare
  fk_row record;
  col_row record;
begin
  -- Drop every FK constraint in public schema that targets public.schools.
  for fk_row in
    select
      tc.table_name,
      tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.constraint_column_usage ccu
      on tc.constraint_name = ccu.constraint_name
      and tc.constraint_schema = ccu.constraint_schema
    where tc.constraint_schema = 'public'
      and tc.constraint_type = 'FOREIGN KEY'
      and ccu.table_schema = 'public'
      and ccu.table_name = 'schools'
  loop
    execute format(
      'alter table public.%I drop constraint if exists %I',
      fk_row.table_name,
      fk_row.constraint_name
    );
  end loop;

  -- In single-school global mode, school_id is optional wherever it still exists.
  for col_row in
    select table_name
    from information_schema.columns
    where table_schema = 'public'
      and column_name = 'school_id'
      and is_nullable = 'NO'
  loop
    execute format(
      'alter table public.%I alter column school_id drop not null',
      col_row.table_name
    );
  end loop;
end $$;

commit;
