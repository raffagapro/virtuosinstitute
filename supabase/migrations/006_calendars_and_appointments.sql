-- Virtuos Institute
-- Migration 006: Calendars And Appointments
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.calendars (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	calendar_type text not null,
	title text not null,
	is_active boolean not null default true,
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint calendars_type_valid check (
		calendar_type in (
			'school_events',
			'clerk_appointments',
			'coordination_appointments',
			'direction_appointments',
			'teacher_schedule'
		)
	),
	constraint calendars_title_not_blank check (char_length(trim(title)) > 0),
	constraint calendars_unique_type_per_school unique (school_id, calendar_type)
);

create index if not exists calendars_school_active_idx
	on public.calendars (school_id, is_active, calendar_type);

create table if not exists public.calendar_events (
	id uuid primary key default gen_random_uuid(),
	calendar_id uuid not null references public.calendars (id) on delete cascade,
	title text not null,
	description text,
	event_type text not null,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	is_all_day boolean not null default false,
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint calendar_events_title_not_blank check (char_length(trim(title)) > 0),
	constraint calendar_events_type_valid check (
		event_type in ('school_event', 'birthday', 'teacher_shift', 'important_date', 'appointment_block')
	),
	constraint calendar_events_time_window check (ends_at > starts_at)
);

create index if not exists calendar_events_calendar_time_idx
	on public.calendar_events (calendar_id, starts_at, ends_at);

create table if not exists public.availability_rules (
	id uuid primary key default gen_random_uuid(),
	calendar_id uuid not null references public.calendars (id) on delete cascade,
	weekday int not null,
	start_time time not null,
	end_time time not null,
	slot_minutes int not null,
	effective_from date not null,
	effective_to date,
	is_active boolean not null default true,
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint availability_rules_weekday_valid check (weekday between 0 and 6),
	constraint availability_rules_time_window check (end_time > start_time),
	constraint availability_rules_slot_minutes_positive check (slot_minutes > 0),
	constraint availability_rules_date_window check (effective_to is null or effective_to >= effective_from)
);

create index if not exists availability_rules_calendar_idx
	on public.availability_rules (calendar_id, weekday, is_active, effective_from);

create table if not exists public.appointment_slots (
	id uuid primary key default gen_random_uuid(),
	calendar_id uuid not null references public.calendars (id) on delete cascade,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	status text not null default 'available',
	capacity int not null default 1,
	booked_count int not null default 0,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint appointment_slots_status_valid check (status in ('available', 'held', 'booked', 'blocked')),
	constraint appointment_slots_time_window check (ends_at > starts_at),
	constraint appointment_slots_capacity_valid check (capacity > 0),
	constraint appointment_slots_booked_count_valid check (booked_count >= 0 and booked_count <= capacity),
	constraint appointment_slots_unique unique (calendar_id, starts_at, ends_at)
);

create index if not exists appointment_slots_calendar_status_idx
	on public.appointment_slots (calendar_id, status, starts_at);

create table if not exists public.guest_tour_requests (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	full_name text not null,
	email text not null,
	phone text,
	preferred_datetime timestamptz not null,
	status text not null default 'requested',
	notes text,
	source text not null default 'public_calendar',
	reviewed_by_profile_id uuid references public.profiles (id) on delete set null,
	reviewed_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint guest_tour_requests_name_not_blank check (char_length(trim(full_name)) > 0),
	constraint guest_tour_requests_email_not_blank check (char_length(trim(email)) > 0),
	constraint guest_tour_requests_status_valid check (
		status in ('requested', 'confirmed', 'completed', 'canceled', 'no_show', 'rejected')
	),
	constraint guest_tour_requests_source_valid check (source in ('public_calendar', 'staff_created'))
);

create index if not exists guest_tour_requests_school_status_idx
	on public.guest_tour_requests (school_id, status, preferred_datetime);

create table if not exists public.appointments (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	calendar_id uuid not null references public.calendars (id) on delete cascade,
	slot_id uuid references public.appointment_slots (id) on delete set null,
	student_id uuid references public.students (id) on delete set null,
	requester_profile_id uuid references public.profiles (id) on delete set null,
	guest_request_id uuid references public.guest_tour_requests (id) on delete set null,
	status text not null default 'requested',
	requested_by_role text not null,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	reason text,
	assigned_staff_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint appointments_status_valid check (
		status in ('requested', 'confirmed', 'completed', 'canceled', 'no_show')
	),
	constraint appointments_requester_role_valid check (
		requested_by_role in ('guest', 'parent', 'staff')
	),
	constraint appointments_time_window check (ends_at > starts_at),
	constraint appointments_requester_consistency check (
		(requested_by_role = 'guest' and guest_request_id is not null)
		or (requested_by_role <> 'guest' and requester_profile_id is not null)
	),
	constraint appointments_unique_slot unique (slot_id)
);

create index if not exists appointments_school_status_idx
	on public.appointments (school_id, status, starts_at);

create index if not exists appointments_calendar_status_idx
	on public.appointments (calendar_id, status, starts_at);

create index if not exists appointments_student_idx
	on public.appointments (student_id, starts_at)
	where student_id is not null;

create table if not exists public.appointment_notes (
	id uuid primary key default gen_random_uuid(),
	appointment_id uuid not null references public.appointments (id) on delete cascade,
	student_id uuid references public.students (id) on delete set null,
	author_profile_id uuid not null references public.profiles (id) on delete restrict,
	note_body text not null,
	is_internal boolean not null default true,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint appointment_notes_body_not_blank check (char_length(trim(note_body)) > 0)
);

create index if not exists appointment_notes_appointment_idx
	on public.appointment_notes (appointment_id, created_at desc);

create index if not exists appointment_notes_student_idx
	on public.appointment_notes (student_id, created_at desc)
	where student_id is not null;

drop trigger if exists trg_calendars_set_updated_at on public.calendars;
create trigger trg_calendars_set_updated_at
before update on public.calendars
for each row
execute function app.set_updated_at();

drop trigger if exists trg_calendar_events_set_updated_at on public.calendar_events;
create trigger trg_calendar_events_set_updated_at
before update on public.calendar_events
for each row
execute function app.set_updated_at();

drop trigger if exists trg_availability_rules_set_updated_at on public.availability_rules;
create trigger trg_availability_rules_set_updated_at
before update on public.availability_rules
for each row
execute function app.set_updated_at();

drop trigger if exists trg_appointment_slots_set_updated_at on public.appointment_slots;
create trigger trg_appointment_slots_set_updated_at
before update on public.appointment_slots
for each row
execute function app.set_updated_at();

drop trigger if exists trg_guest_tour_requests_set_updated_at on public.guest_tour_requests;
create trigger trg_guest_tour_requests_set_updated_at
before update on public.guest_tour_requests
for each row
execute function app.set_updated_at();

drop trigger if exists trg_appointments_set_updated_at on public.appointments;
create trigger trg_appointments_set_updated_at
before update on public.appointments
for each row
execute function app.set_updated_at();

drop trigger if exists trg_appointment_notes_set_updated_at on public.appointment_notes;
create trigger trg_appointment_notes_set_updated_at
before update on public.appointment_notes
for each row
execute function app.set_updated_at();

commit;