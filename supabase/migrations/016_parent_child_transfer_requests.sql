-- Virtuos Institute
-- Migration 016: Parent Child Transfer Requests
-- Adds audited two-step transfer requests before moving student guardianship links.

begin;

create table if not exists public.parent_child_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  source_parent_profile_id uuid not null references public.profiles (id) on delete restrict,
  target_parent_profile_id uuid not null references public.profiles (id) on delete restrict,
  student_ids uuid[] not null,
  status text not null default 'pending_confirmation',
  initiated_by_profile_id uuid not null references public.profiles (id) on delete restrict,
  confirmed_by_profile_id uuid references public.profiles (id) on delete set null,
  contacted_current_parent boolean not null default false,
  contacted_target_parent boolean not null default false,
  communication_notes text,
  confirmed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint parent_child_transfer_requests_status_valid check (
    status in ('pending_confirmation', 'confirmed', 'cancelled', 'rejected')
  ),
  constraint parent_child_transfer_requests_distinct_parents check (
    source_parent_profile_id <> target_parent_profile_id
  ),
  constraint parent_child_transfer_requests_students_not_empty check (
    array_length(student_ids, 1) is not null and array_length(student_ids, 1) > 0
  )
);

create index if not exists parent_child_transfer_requests_source_idx
  on public.parent_child_transfer_requests (source_parent_profile_id, status, created_at desc);

create index if not exists parent_child_transfer_requests_target_idx
  on public.parent_child_transfer_requests (target_parent_profile_id, status, created_at desc);

create index if not exists parent_child_transfer_requests_initiated_idx
  on public.parent_child_transfer_requests (initiated_by_profile_id, created_at desc);

commit;
