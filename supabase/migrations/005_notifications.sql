-- Virtuos Institute
-- Migration 005: Notifications
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.announcements (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	title text not null,
	body text not null,
	audience text not null,
	audience_ref text,
	priority text not null default 'normal',
	status text not null default 'draft',
	published_by_profile_id uuid references public.profiles (id) on delete set null,
	published_at timestamptz,
	expires_at timestamptz,
	created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint announcements_title_not_blank check (char_length(trim(title)) > 0),
	constraint announcements_body_not_blank check (char_length(trim(body)) > 0),
	constraint announcements_audience_valid check (
		audience in ('school', 'grade', 'student-list', 'staff', 'parents')
	),
	constraint announcements_priority_valid check (priority in ('normal', 'high')),
	constraint announcements_status_valid check (status in ('draft', 'published', 'archived', 'canceled')),
	constraint announcements_publish_fields_consistent check (
		(status = 'published' and published_at is not null)
		or status <> 'published'
	),
	constraint announcements_expiry_after_publish check (
		expires_at is null or published_at is null or expires_at > published_at
	)
);

create index if not exists announcements_school_status_idx
	on public.announcements (school_id, status, published_at desc);

create index if not exists announcements_school_audience_idx
	on public.announcements (school_id, audience, priority, published_at desc);

create table if not exists public.notification_campaigns (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	title text not null,
	subject text,
	body text not null,
	target_audience text not null,
	delivery_mode text not null default 'immediate',
	status text not null default 'draft',
	scheduled_for timestamptz,
	banner_media_asset_id uuid references public.media_assets (id) on delete set null,
	send_email boolean not null default true,
	send_in_app boolean not null default true,
	created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
	launched_at timestamptz,
	completed_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint notification_campaigns_title_not_blank check (char_length(trim(title)) > 0),
	constraint notification_campaigns_body_not_blank check (char_length(trim(body)) > 0),
	constraint notification_campaigns_target_audience_valid check (
		target_audience in ('parents', 'staff', 'both', 'school')
	),
	constraint notification_campaigns_delivery_mode_valid check (
		delivery_mode in ('immediate', 'scheduled')
	),
	constraint notification_campaigns_status_valid check (
		status in ('draft', 'scheduled', 'sending', 'sent', 'canceled', 'failed')
	),
	constraint notification_campaigns_schedule_consistent check (
		(delivery_mode = 'scheduled' and scheduled_for is not null)
		or (delivery_mode = 'immediate')
	),
	constraint notification_campaigns_channel_required check (
		send_email = true or send_in_app = true
	),
	constraint notification_campaigns_completed_after_launch check (
		completed_at is null or launched_at is null or completed_at >= launched_at
	)
);

create index if not exists notification_campaigns_school_status_idx
	on public.notification_campaigns (school_id, status, created_at desc);

create index if not exists notification_campaigns_school_schedule_idx
	on public.notification_campaigns (school_id, delivery_mode, scheduled_for);

create table if not exists public.notification_deliveries (
	id uuid primary key default gen_random_uuid(),
	campaign_id uuid not null references public.notification_campaigns (id) on delete cascade,
	school_id uuid not null references public.schools (id) on delete cascade,
	profile_id uuid not null references public.profiles (id) on delete cascade,
	email_status text not null default 'pending',
	in_app_status text not null default 'unread',
	email_provider_message_id text,
	failure_reason text,
	delivered_at timestamptz,
	read_at timestamptz,
	hidden_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint notification_deliveries_email_status_valid check (
		email_status in ('pending', 'sent', 'failed', 'skipped')
	),
	constraint notification_deliveries_in_app_status_valid check (
		in_app_status in ('unread', 'read', 'hidden')
	),
	constraint notification_deliveries_read_time_consistent check (
		read_at is null or in_app_status = 'read'
	),
	constraint notification_deliveries_hidden_time_consistent check (
		hidden_at is null or in_app_status = 'hidden'
	),
	constraint notification_deliveries_unique_recipient unique (campaign_id, profile_id)
);

create index if not exists notification_deliveries_profile_unread_idx
	on public.notification_deliveries (profile_id, in_app_status, created_at desc);

create index if not exists notification_deliveries_school_email_status_idx
	on public.notification_deliveries (school_id, email_status, created_at desc);

create index if not exists notification_deliveries_campaign_idx
	on public.notification_deliveries (campaign_id, created_at desc);

drop trigger if exists trg_announcements_set_updated_at on public.announcements;
create trigger trg_announcements_set_updated_at
before update on public.announcements
for each row
execute function app.set_updated_at();

drop trigger if exists trg_notification_campaigns_set_updated_at on public.notification_campaigns;
create trigger trg_notification_campaigns_set_updated_at
before update on public.notification_campaigns
for each row
execute function app.set_updated_at();

drop trigger if exists trg_notification_deliveries_set_updated_at on public.notification_deliveries;
create trigger trg_notification_deliveries_set_updated_at
before update on public.notification_deliveries
for each row
execute function app.set_updated_at();

commit;