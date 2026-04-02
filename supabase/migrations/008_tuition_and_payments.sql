-- Virtuos Institute
-- Migration 008: Tuition And Payments
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.student_tuition_accounts (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	student_id uuid not null references public.students (id) on delete cascade,
	status text not null default 'active',
	currency_code text not null default 'MXN',
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint student_tuition_accounts_status_valid check (status in ('active', 'paused', 'closed')),
	constraint student_tuition_accounts_currency_code_valid check (char_length(currency_code) = 3),
	constraint student_tuition_accounts_unique_student unique (student_id)
);

create index if not exists student_tuition_accounts_school_status_idx
	on public.student_tuition_accounts (school_id, status);

create table if not exists public.tuition_periods (
	id uuid primary key default gen_random_uuid(),
	tuition_account_id uuid not null references public.student_tuition_accounts (id) on delete cascade,
	label text not null,
	period_start date not null,
	period_end date not null,
	due_date date not null,
	status text not null default 'open',
	created_by_profile_id uuid references public.profiles (id) on delete set null,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint tuition_periods_label_not_blank check (char_length(trim(label)) > 0),
	constraint tuition_periods_status_valid check (status in ('open', 'closed', 'canceled')),
	constraint tuition_periods_date_window_valid check (period_end >= period_start),
	constraint tuition_periods_due_within_reasonable_range check (due_date >= period_start - 365 and due_date <= period_end + 365),
	constraint tuition_periods_unique_account_label unique (tuition_account_id, label)
);

create index if not exists tuition_periods_account_status_idx
	on public.tuition_periods (tuition_account_id, status, due_date);

create table if not exists public.tuition_quotes (
	id uuid primary key default gen_random_uuid(),
	tuition_period_id uuid not null references public.tuition_periods (id) on delete cascade,
	price_label text not null,
	amount numeric(12,2) not null,
	window_starts_at timestamptz,
	window_ends_at timestamptz,
	payment_reference text not null,
	status text not null default 'active',
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint tuition_quotes_price_label_not_blank check (char_length(trim(price_label)) > 0),
	constraint tuition_quotes_amount_positive check (amount > 0),
	constraint tuition_quotes_window_valid check (window_ends_at is null or window_starts_at is null or window_ends_at > window_starts_at),
	constraint tuition_quotes_status_valid check (status in ('active', 'expired', 'canceled', 'paid')),
	constraint tuition_quotes_payment_reference_not_blank check (char_length(trim(payment_reference)) > 0),
	constraint tuition_quotes_unique_window_per_period unique (tuition_period_id, price_label)
);

create unique index if not exists tuition_quotes_payment_reference_unique_idx
	on public.tuition_quotes (payment_reference);

create index if not exists tuition_quotes_period_status_idx
	on public.tuition_quotes (tuition_period_id, status, window_starts_at);

create table if not exists public.payment_records (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	student_id uuid not null references public.students (id) on delete cascade,
	tuition_quote_id uuid not null references public.tuition_quotes (id) on delete restrict,
	payment_method text not null,
	status text not null default 'pending',
	amount numeric(12,2) not null,
	reference_code text,
	paid_at timestamptz,
	recorded_by_profile_id uuid references public.profiles (id) on delete set null,
	notes text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint payment_records_method_valid check (payment_method in ('transfer', 'deposit', 'cash', 'card', 'other')),
	constraint payment_records_status_valid check (status in ('pending', 'paid', 'failed', 'canceled', 'refunded')),
	constraint payment_records_amount_positive check (amount > 0),
	constraint payment_records_paid_at_when_paid check ((status <> 'paid') or paid_at is not null)
);

create index if not exists payment_records_school_status_idx
	on public.payment_records (school_id, status, created_at desc);

create index if not exists payment_records_student_paid_idx
	on public.payment_records (student_id, status, paid_at desc);

create index if not exists payment_records_quote_idx
	on public.payment_records (tuition_quote_id);

drop trigger if exists trg_student_tuition_accounts_set_updated_at on public.student_tuition_accounts;
create trigger trg_student_tuition_accounts_set_updated_at
before update on public.student_tuition_accounts
for each row
execute function app.set_updated_at();

drop trigger if exists trg_tuition_periods_set_updated_at on public.tuition_periods;
create trigger trg_tuition_periods_set_updated_at
before update on public.tuition_periods
for each row
execute function app.set_updated_at();

drop trigger if exists trg_tuition_quotes_set_updated_at on public.tuition_quotes;
create trigger trg_tuition_quotes_set_updated_at
before update on public.tuition_quotes
for each row
execute function app.set_updated_at();

drop trigger if exists trg_payment_records_set_updated_at on public.payment_records;
create trigger trg_payment_records_set_updated_at
before update on public.payment_records
for each row
execute function app.set_updated_at();

commit;