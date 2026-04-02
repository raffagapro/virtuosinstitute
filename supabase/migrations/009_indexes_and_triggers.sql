-- Virtuos Institute
-- Migration 009: Indexes And Triggers
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create index if not exists school_memberships_school_profile_active_idx
	on public.school_memberships (school_id, profile_id)
	where is_active = true and approval_status = 'approved';

create index if not exists students_school_grade_idx
	on public.students (school_id, grade_level, approval_status);

create index if not exists guest_tour_requests_school_datetime_idx
	on public.guest_tour_requests (school_id, preferred_datetime desc);

create index if not exists appointments_school_status_time_idx
	on public.appointments (school_id, status, starts_at desc);

create index if not exists appointment_notes_appointment_created_idx
	on public.appointment_notes (appointment_id, created_at);

create index if not exists threads_school_student_updated_idx
	on public.threads (school_id, student_id, updated_at desc);

create index if not exists thread_participants_thread_profile_idx
	on public.thread_participants (thread_id, profile_id);

create index if not exists messages_thread_created_desc_idx
	on public.messages (thread_id, created_at desc);

create index if not exists notification_deliveries_profile_created_idx
	on public.notification_deliveries (profile_id, created_at desc);

create index if not exists notification_deliveries_campaign_status_idx
	on public.notification_deliveries (campaign_id, email_status, in_app_status);

create index if not exists payment_records_student_status_paid_idx
	on public.payment_records (student_id, status, paid_at desc);

create index if not exists tuition_quotes_reference_idx
	on public.tuition_quotes (payment_reference);

create or replace function app.touch_thread_on_message_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
	update public.threads
	set
		last_message_at = new.created_at,
		updated_at = timezone('utc', now())
	where id = new.thread_id;

	return new;
end;
$$;

drop trigger if exists trg_messages_touch_thread on public.messages;
create trigger trg_messages_touch_thread
after insert on public.messages
for each row
execute function app.touch_thread_on_message_insert();

update public.threads t
set last_message_at = m.max_created_at
from (
	select thread_id, max(created_at) as max_created_at
	from public.messages
	group by thread_id
) m
where t.id = m.thread_id
	and (t.last_message_at is null or t.last_message_at <> m.max_created_at);

create or replace function app.prevent_student_pickup_audit_mutation()
returns trigger
language plpgsql
as $$
begin
	raise exception 'student_pickup_audit_logs is append-only';
end;
$$;

drop trigger if exists trg_student_pickup_audit_logs_no_update on public.student_pickup_audit_logs;
create trigger trg_student_pickup_audit_logs_no_update
before update on public.student_pickup_audit_logs
for each row
execute function app.prevent_student_pickup_audit_mutation();

drop trigger if exists trg_student_pickup_audit_logs_no_delete on public.student_pickup_audit_logs;
create trigger trg_student_pickup_audit_logs_no_delete
before delete on public.student_pickup_audit_logs
for each row
execute function app.prevent_student_pickup_audit_mutation();

commit;