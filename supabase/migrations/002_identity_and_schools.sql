-- Virtuos Institute
-- Migration 002: Identity And Schools
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.schools (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	slug text not null unique,
	is_active boolean not null default true,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint schools_name_not_blank check (char_length(trim(name)) > 0),
	constraint schools_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	full_name text not null,
	email text,
	platform_role text,
	phone text,
	preferred_locale text not null default 'es-MX',
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint profiles_full_name_not_blank check (char_length(trim(full_name)) > 0),
	constraint profiles_platform_role_valid check (platform_role is null or platform_role in ('superadmin')),
	constraint profiles_preferred_locale_valid check (preferred_locale in ('es-MX', 'en-US'))
);

create unique index if not exists profiles_email_unique_idx
	on public.profiles (lower(email))
	where email is not null;

create table if not exists public.parent_profiles (
	profile_id uuid primary key references public.profiles (id) on delete cascade,
	curp text not null,
	rfc text,
	invoice_required boolean not null default false,
	profession text,
	government_id_document_id uuid,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint parent_profiles_curp_not_blank check (char_length(trim(curp)) > 0),
	constraint parent_profiles_rfc_when_invoice check (invoice_required = false or rfc is not null)
);

create unique index if not exists parent_profiles_curp_unique_idx
	on public.parent_profiles (upper(curp));

create table if not exists public.staff_profiles (
	profile_id uuid primary key references public.profiles (id) on delete cascade,
	government_id_document_id uuid,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.school_memberships (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	profile_id uuid not null references public.profiles (id) on delete cascade,
	school_role text not null,
	is_active boolean not null default true,
	approval_status text not null default 'pending',
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint school_memberships_role_valid check (
		school_role in ('school_owner', 'direction', 'coordination', 'teacher', 'clerk', 'parent', 'student', 'guest')
	),
	constraint school_memberships_approval_status_valid check (
		approval_status in ('pending', 'approved', 'rejected', 'suspended')
	),
	constraint school_memberships_unique unique (school_id, profile_id, school_role)
);

create index if not exists school_memberships_school_role_idx
	on public.school_memberships (school_id, school_role)
	where is_active = true;

create index if not exists school_memberships_profile_idx
	on public.school_memberships (profile_id, school_id)
	where is_active = true;

create table if not exists public.parent_approval_requests (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	profile_id uuid not null references public.profiles (id) on delete cascade,
	status text not null default 'pending',
	reviewed_by_profile_id uuid references public.profiles (id) on delete set null,
	reviewed_at timestamptz,
	notes text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint parent_approval_requests_status_valid check (
		status in ('pending', 'approved', 'rejected', 'suspended')
	)
);

create index if not exists parent_approval_requests_school_status_idx
	on public.parent_approval_requests (school_id, status);

create index if not exists parent_approval_requests_profile_status_idx
	on public.parent_approval_requests (profile_id, status);

drop trigger if exists trg_schools_set_updated_at on public.schools;
create trigger trg_schools_set_updated_at
before update on public.schools
for each row
execute function app.set_updated_at();

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function app.set_updated_at();

drop trigger if exists trg_parent_profiles_set_updated_at on public.parent_profiles;
create trigger trg_parent_profiles_set_updated_at
before update on public.parent_profiles
for each row
execute function app.set_updated_at();

drop trigger if exists trg_staff_profiles_set_updated_at on public.staff_profiles;
create trigger trg_staff_profiles_set_updated_at
before update on public.staff_profiles
for each row
execute function app.set_updated_at();

drop trigger if exists trg_school_memberships_set_updated_at on public.school_memberships;
create trigger trg_school_memberships_set_updated_at
before update on public.school_memberships
for each row
execute function app.set_updated_at();

drop trigger if exists trg_parent_approval_requests_set_updated_at on public.parent_approval_requests;
create trigger trg_parent_approval_requests_set_updated_at
before update on public.parent_approval_requests
for each row
execute function app.set_updated_at();

create or replace function app.is_superadmin()
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.profiles p
		where p.id = app.current_profile_id()
			and p.platform_role = 'superadmin'
	);
$$;

create or replace function app.has_any_school_membership(school_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.school_memberships sm
		where sm.school_id = school_uuid
			and sm.profile_id = app.current_profile_id()
			and sm.is_active = true
			and sm.approval_status = 'approved'
	);
$$;

create or replace function app.has_school_role(school_uuid uuid, roles text[])
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.school_memberships sm
		where sm.school_id = school_uuid
			and sm.profile_id = app.current_profile_id()
			and sm.is_active = true
			and sm.approval_status = 'approved'
			and sm.school_role = any(roles)
	);
$$;

commit;