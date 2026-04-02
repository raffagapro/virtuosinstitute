-- Virtuos Institute
-- Migration 007: Messaging
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.threads (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	student_id uuid references public.students (id) on delete set null,
	subject text not null,
	status text not null default 'open',
	created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
	last_message_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint threads_subject_not_blank check (char_length(trim(subject)) > 0),
	constraint threads_status_valid check (status in ('open', 'closed', 'archived'))
);

create index if not exists threads_school_status_updated_idx
	on public.threads (school_id, status, updated_at desc);

create index if not exists threads_student_updated_idx
	on public.threads (student_id, updated_at desc)
	where student_id is not null;

create table if not exists public.thread_participants (
	id uuid primary key default gen_random_uuid(),
	thread_id uuid not null references public.threads (id) on delete cascade,
	profile_id uuid not null references public.profiles (id) on delete cascade,
	participant_role text,
	last_read_at timestamptz,
	joined_at timestamptz not null default timezone('utc', now()),
	created_at timestamptz not null default timezone('utc', now()),
	constraint thread_participants_unique unique (thread_id, profile_id)
);

create index if not exists thread_participants_profile_idx
	on public.thread_participants (profile_id, thread_id);

create table if not exists public.messages (
	id uuid primary key default gen_random_uuid(),
	thread_id uuid not null references public.threads (id) on delete cascade,
	sender_profile_id uuid not null references public.profiles (id) on delete restrict,
	body text not null,
	message_type text not null default 'text',
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint messages_body_not_blank check (char_length(trim(body)) > 0),
	constraint messages_type_valid check (message_type in ('text', 'system', 'attachment'))
);

create index if not exists messages_thread_created_idx
	on public.messages (thread_id, created_at);

create index if not exists messages_sender_created_idx
	on public.messages (sender_profile_id, created_at desc);

drop trigger if exists trg_threads_set_updated_at on public.threads;
create trigger trg_threads_set_updated_at
before update on public.threads
for each row
execute function app.set_updated_at();

drop trigger if exists trg_messages_set_updated_at on public.messages;
create trigger trg_messages_set_updated_at
before update on public.messages
for each row
execute function app.set_updated_at();

create or replace function app.is_thread_participant(thread_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.thread_participants tp
		where tp.thread_id = thread_uuid
			and tp.profile_id = app.current_profile_id()
	);
$$;

commit;