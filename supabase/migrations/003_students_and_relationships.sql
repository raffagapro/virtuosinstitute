-- Virtuos Institute
-- Migration 003: Students And Relationships
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.students (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	full_name text not null,
	curp text,
	grade_level text,
	blood_type text,
	allergies text,
	enrollment_date date,
	onboarding_status text not null default 'draft',
	approval_status text not null default 'pending',
	approved_by_profile_id uuid references public.profiles (id) on delete set null,
	approved_at timestamptz,
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	notes text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint students_full_name_not_blank check (char_length(trim(full_name)) > 0),
	constraint students_curp_not_blank check (curp is null or char_length(trim(curp)) > 0),
	constraint students_onboarding_status_valid check (onboarding_status in ('draft', 'submitted', 'needs_changes', 'approved')),
	constraint students_approval_status_valid check (approval_status in ('pending', 'approved', 'rejected', 'suspended')),
	constraint students_approval_fields_consistent check (
		(approval_status = 'approved' and approved_at is not null)
		or (approval_status <> 'approved')
	)
);

create unique index if not exists students_school_curp_unique_idx
	on public.students (school_id, upper(curp))
	where curp is not null;

create index if not exists students_school_status_idx
	on public.students (school_id, approval_status, onboarding_status);

create table if not exists public.student_guardians (
	id uuid primary key default gen_random_uuid(),
	student_id uuid not null references public.students (id) on delete cascade,
	parent_profile_id uuid not null references public.parent_profiles (profile_id) on delete cascade,
	relationship_type text not null,
	is_primary_contact boolean not null default false,
	is_legal_guardian boolean not null default false,
	link_status text not null default 'pending',
	approved_by_profile_id uuid references public.profiles (id) on delete set null,
	approved_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint student_guardians_relationship_not_blank check (char_length(trim(relationship_type)) > 0),
	constraint student_guardians_link_status_valid check (link_status in ('pending', 'approved', 'rejected', 'revoked')),
	constraint student_guardians_unique_link unique (student_id, parent_profile_id)
);

create unique index if not exists student_guardians_one_primary_idx
	on public.student_guardians (student_id)
	where is_primary_contact = true and link_status = 'approved';

create index if not exists student_guardians_parent_idx
	on public.student_guardians (parent_profile_id, link_status);

create table if not exists public.student_pickup_contacts (
	id uuid primary key default gen_random_uuid(),
	student_id uuid not null references public.students (id) on delete cascade,
	school_id uuid not null references public.schools (id) on delete cascade,
	full_name text not null,
	relationship_to_student text,
	phone text,
	email text,
	government_id_type text,
	government_id_last4 text,
	verification_status text not null default 'pending',
	is_active boolean not null default true,
	added_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint student_pickup_contacts_full_name_not_blank check (char_length(trim(full_name)) > 0),
	constraint student_pickup_contacts_verification_status_valid check (
		verification_status in ('pending', 'verified', 'rejected', 'revoked')
	)
);

create index if not exists student_pickup_contacts_student_idx
	on public.student_pickup_contacts (student_id, is_active, verification_status);

create index if not exists student_pickup_contacts_school_idx
	on public.student_pickup_contacts (school_id, is_active);

create table if not exists public.student_pickup_authorizations (
	id uuid primary key default gen_random_uuid(),
	student_id uuid not null references public.students (id) on delete cascade,
	pickup_contact_id uuid not null references public.student_pickup_contacts (id) on delete cascade,
	authorized_by_parent_profile_id uuid not null references public.parent_profiles (profile_id) on delete restrict,
	status text not null default 'active',
	valid_from timestamptz not null default timezone('utc', now()),
	valid_until timestamptz,
	revoked_at timestamptz,
	revoked_by_profile_id uuid references public.profiles (id) on delete set null,
	revocation_reason text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint student_pickup_authorizations_status_valid check (
		status in ('active', 'revoked', 'expired', 'suspended')
	),
	constraint student_pickup_authorizations_valid_window check (
		valid_until is null or valid_until > valid_from
	),
	constraint student_pickup_authorizations_revoked_fields check (
		(status <> 'revoked')
		or (revoked_at is not null)
	)
);

create index if not exists student_pickup_authorizations_student_idx
	on public.student_pickup_authorizations (student_id, status, valid_from);

create index if not exists student_pickup_authorizations_contact_idx
	on public.student_pickup_authorizations (pickup_contact_id, status);

create table if not exists public.student_pickup_audit_logs (
	id bigserial primary key,
	school_id uuid not null references public.schools (id) on delete cascade,
	student_id uuid not null references public.students (id) on delete cascade,
	pickup_contact_id uuid references public.student_pickup_contacts (id) on delete set null,
	authorization_id uuid references public.student_pickup_authorizations (id) on delete set null,
	action_type text not null,
	actor_profile_id uuid references public.profiles (id) on delete set null,
	actor_role text,
	reason text,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default timezone('utc', now()),
	constraint student_pickup_audit_logs_action_type_valid check (
		action_type in (
			'contact_added',
			'contact_updated',
			'contact_deactivated',
			'authorization_granted',
			'authorization_revoked',
			'authorization_suspended',
			'authorization_expired',
			'pickup_verified',
			'pickup_denied'
		)
	)
);

create index if not exists student_pickup_audit_logs_student_created_idx
	on public.student_pickup_audit_logs (student_id, created_at desc);

create index if not exists student_pickup_audit_logs_school_created_idx
	on public.student_pickup_audit_logs (school_id, created_at desc);

create table if not exists public.academic_classes (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	name text not null,
	grade_level text,
	academic_year text not null,
	homeroom_teacher_profile_id uuid references public.profiles (id) on delete set null,
	is_active boolean not null default true,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint academic_classes_name_not_blank check (char_length(trim(name)) > 0),
	constraint academic_classes_year_not_blank check (char_length(trim(academic_year)) > 0),
	constraint academic_classes_unique_name_per_year unique (school_id, academic_year, name)
);

create index if not exists academic_classes_school_idx
	on public.academic_classes (school_id, academic_year, is_active);

create table if not exists public.teacher_class_assignments (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	class_id uuid not null references public.academic_classes (id) on delete cascade,
	teacher_profile_id uuid not null references public.profiles (id) on delete cascade,
	assignment_role text not null default 'lead',
	status text not null default 'active',
	starts_on date,
	ends_on date,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint teacher_class_assignments_role_valid check (assignment_role in ('lead', 'assistant', 'specialist')),
	constraint teacher_class_assignments_status_valid check (status in ('active', 'inactive', 'archived')),
	constraint teacher_class_assignments_date_window check (ends_on is null or starts_on is null or ends_on >= starts_on),
	constraint teacher_class_assignments_unique unique (class_id, teacher_profile_id, assignment_role)
);

create index if not exists teacher_class_assignments_teacher_idx
	on public.teacher_class_assignments (teacher_profile_id, status);

create index if not exists teacher_class_assignments_school_idx
	on public.teacher_class_assignments (school_id, status);

drop trigger if exists trg_students_set_updated_at on public.students;
create trigger trg_students_set_updated_at
before update on public.students
for each row
execute function app.set_updated_at();

drop trigger if exists trg_student_guardians_set_updated_at on public.student_guardians;
create trigger trg_student_guardians_set_updated_at
before update on public.student_guardians
for each row
execute function app.set_updated_at();

drop trigger if exists trg_student_pickup_contacts_set_updated_at on public.student_pickup_contacts;
create trigger trg_student_pickup_contacts_set_updated_at
before update on public.student_pickup_contacts
for each row
execute function app.set_updated_at();

drop trigger if exists trg_student_pickup_authorizations_set_updated_at on public.student_pickup_authorizations;
create trigger trg_student_pickup_authorizations_set_updated_at
before update on public.student_pickup_authorizations
for each row
execute function app.set_updated_at();

drop trigger if exists trg_academic_classes_set_updated_at on public.academic_classes;
create trigger trg_academic_classes_set_updated_at
before update on public.academic_classes
for each row
execute function app.set_updated_at();

drop trigger if exists trg_teacher_class_assignments_set_updated_at on public.teacher_class_assignments;
create trigger trg_teacher_class_assignments_set_updated_at
before update on public.teacher_class_assignments
for each row
execute function app.set_updated_at();

create or replace function app.is_linked_parent(student_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.student_guardians sg
		where sg.student_id = student_uuid
			and sg.parent_profile_id = app.current_profile_id()
			and sg.link_status = 'approved'
	);
$$;

commit;