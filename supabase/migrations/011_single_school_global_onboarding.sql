-- Virtuos Institute
-- Migration 011: Single-School Global Onboarding
-- Purpose: remove school-scoped dependency for parent onboarding/approval flows.

begin;

alter table public.school_memberships
  alter column school_id drop not null;

alter table public.parent_approval_requests
  alter column school_id drop not null;

alter table public.school_memberships
  drop constraint if exists school_memberships_school_id_fkey;

alter table public.parent_approval_requests
  drop constraint if exists parent_approval_requests_school_id_fkey;

alter table public.school_memberships
  drop constraint if exists school_memberships_unique;

alter table public.school_memberships
  add constraint school_memberships_unique unique (profile_id, school_role);

create or replace function app.has_global_staff_role()
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships sm
    where sm.profile_id = app.current_profile_id()
      and sm.is_active = true
      and sm.approval_status = 'approved'
      and sm.school_role in ('school_owner', 'direction', 'coordination', 'teacher', 'clerk')
  );
$$;

create or replace function app.has_global_management_role()
returns boolean
language sql
stable
set search_path = public
as $$
  select app.is_superadmin() or exists (
    select 1
    from public.school_memberships sm
    where sm.profile_id = app.current_profile_id()
      and sm.is_active = true
      and sm.approval_status = 'approved'
      and sm.school_role in ('school_owner', 'direction', 'coordination', 'clerk')
  );
$$;

drop policy if exists school_memberships_read_policy on public.school_memberships;
create policy school_memberships_read_policy on public.school_memberships
for select
to authenticated
using (
  profile_id = app.current_profile_id()
  or app.is_superadmin()
  or app.has_global_staff_role()
);

drop policy if exists school_memberships_manage_policy on public.school_memberships;
create policy school_memberships_manage_policy on public.school_memberships
for all
to authenticated
using (app.has_global_management_role())
with check (app.has_global_management_role());

drop policy if exists parent_approval_requests_read_policy on public.parent_approval_requests;
create policy parent_approval_requests_read_policy on public.parent_approval_requests
for select
to authenticated
using (
  profile_id = app.current_profile_id()
  or app.has_global_staff_role()
);

drop policy if exists parent_approval_requests_write_policy on public.parent_approval_requests;
create policy parent_approval_requests_write_policy on public.parent_approval_requests
for all
to authenticated
using (
  profile_id = app.current_profile_id()
  or app.has_global_management_role()
)
with check (
  profile_id = app.current_profile_id()
  or app.has_global_management_role()
);

-- Rebuild indexes that were school-scoped for these onboarding tables.
drop index if exists school_memberships_school_role_idx;
create index if not exists school_memberships_role_status_idx
  on public.school_memberships (school_role, approval_status)
  where is_active = true;

drop index if exists school_memberships_profile_idx;
create index if not exists school_memberships_profile_idx
  on public.school_memberships (profile_id)
  where is_active = true;

drop index if exists parent_approval_requests_school_status_idx;
create index if not exists parent_approval_requests_status_idx
  on public.parent_approval_requests (status);

commit;
