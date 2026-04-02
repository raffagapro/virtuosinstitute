-- Virtuos Institute
-- Migration 010: RLS Policies
-- Reference: docs/RLS_POLICY_PLAN.md

begin;

create or replace function app.can_access_school(school_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select app.is_superadmin() or app.has_any_school_membership(school_uuid);
$$;

create or replace function app.has_school_management_role(school_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select app.is_superadmin() or app.has_school_role(school_uuid, array['school_owner', 'direction', 'coordination', 'clerk']);
$$;

create or replace function app.has_school_staff_role(school_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select app.is_superadmin() or app.has_school_role(school_uuid, array['school_owner', 'direction', 'coordination', 'teacher', 'clerk']);
$$;

create or replace function app.can_view_student(student_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.students s
		where s.id = student_uuid
			and (
				app.has_school_staff_role(s.school_id)
				or app.is_linked_parent(s.id)
			)
	);
$$;

create or replace function app.can_manage_student(student_uuid uuid)
returns boolean
language sql
stable
set search_path = public
as $$
	select exists (
		select 1
		from public.students s
		where s.id = student_uuid
			and app.has_school_management_role(s.school_id)
	);
$$;

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.parent_profiles enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.school_memberships enable row level security;
alter table public.parent_approval_requests enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_documents enable row level security;
alter table public.identity_documents enable row level security;
alter table public.student_pickup_contacts enable row level security;
alter table public.student_pickup_authorizations enable row level security;
alter table public.student_pickup_audit_logs enable row level security;
alter table public.academic_classes enable row level security;
alter table public.teacher_class_assignments enable row level security;
alter table public.announcements enable row level security;
alter table public.notification_campaigns enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.media_assets enable row level security;
alter table public.calendars enable row level security;
alter table public.calendar_events enable row level security;
alter table public.availability_rules enable row level security;
alter table public.appointment_slots enable row level security;
alter table public.guest_tour_requests enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_notes enable row level security;
alter table public.threads enable row level security;
alter table public.thread_participants enable row level security;
alter table public.messages enable row level security;
alter table public.student_tuition_accounts enable row level security;
alter table public.tuition_periods enable row level security;
alter table public.tuition_quotes enable row level security;
alter table public.payment_records enable row level security;

drop policy if exists schools_read_policy on public.schools;
create policy schools_read_policy on public.schools
for select
to authenticated
using (app.can_access_school(id));

drop policy if exists schools_manage_policy on public.schools;
create policy schools_manage_policy on public.schools
for all
to authenticated
using (app.has_school_management_role(id))
with check (app.has_school_management_role(id));

drop policy if exists profiles_read_policy on public.profiles;
create policy profiles_read_policy on public.profiles
for select
to authenticated
using (
	id = app.current_profile_id()
	or app.is_superadmin()
	or exists (
		select 1
		from public.school_memberships sm_target
		join public.school_memberships sm_me
			on sm_target.school_id = sm_me.school_id
		where sm_target.profile_id = profiles.id
			and sm_me.profile_id = app.current_profile_id()
			and sm_me.is_active = true
			and sm_me.approval_status = 'approved'
	)
);

drop policy if exists profiles_update_self_policy on public.profiles;
create policy profiles_update_self_policy on public.profiles
for update
to authenticated
using (id = app.current_profile_id() or app.is_superadmin())
with check (id = app.current_profile_id() or app.is_superadmin());

drop policy if exists parent_profiles_read_policy on public.parent_profiles;
create policy parent_profiles_read_policy on public.parent_profiles
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.is_superadmin()
	or exists (
		select 1
		from public.school_memberships sm
		where sm.profile_id = app.current_profile_id()
			and sm.school_role in ('school_owner', 'direction', 'coordination', 'clerk', 'teacher')
			and sm.is_active = true
			and sm.approval_status = 'approved'
	)
);

drop policy if exists parent_profiles_write_policy on public.parent_profiles;
create policy parent_profiles_write_policy on public.parent_profiles
for all
to authenticated
using (profile_id = app.current_profile_id() or app.is_superadmin())
with check (profile_id = app.current_profile_id() or app.is_superadmin());

drop policy if exists staff_profiles_read_policy on public.staff_profiles;
create policy staff_profiles_read_policy on public.staff_profiles
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.is_superadmin()
	or exists (
		select 1
		from public.school_memberships sm_target
		join public.school_memberships sm_me
			on sm_target.school_id = sm_me.school_id
		where sm_target.profile_id = staff_profiles.profile_id
			and sm_me.profile_id = app.current_profile_id()
			and sm_me.school_role in ('school_owner', 'direction', 'coordination', 'clerk')
			and sm_me.is_active = true
			and sm_me.approval_status = 'approved'
	)
);

drop policy if exists staff_profiles_write_policy on public.staff_profiles;
create policy staff_profiles_write_policy on public.staff_profiles
for all
to authenticated
using (profile_id = app.current_profile_id() or app.is_superadmin())
with check (profile_id = app.current_profile_id() or app.is_superadmin());

drop policy if exists school_memberships_read_policy on public.school_memberships;
create policy school_memberships_read_policy on public.school_memberships
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.can_access_school(school_id)
);

drop policy if exists school_memberships_manage_policy on public.school_memberships;
create policy school_memberships_manage_policy on public.school_memberships
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists parent_approval_requests_read_policy on public.parent_approval_requests;
create policy parent_approval_requests_read_policy on public.parent_approval_requests
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.has_school_staff_role(school_id)
);

drop policy if exists parent_approval_requests_write_policy on public.parent_approval_requests;
create policy parent_approval_requests_write_policy on public.parent_approval_requests
for all
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.has_school_management_role(school_id)
)
with check (
	profile_id = app.current_profile_id()
	or app.has_school_management_role(school_id)
);

drop policy if exists students_read_policy on public.students;
create policy students_read_policy on public.students
for select
to authenticated
using (app.can_view_student(id));

drop policy if exists students_write_policy on public.students;
create policy students_write_policy on public.students
for all
to authenticated
using (app.can_manage_student(id) or created_by_profile_id = app.current_profile_id())
with check (app.can_manage_student(id) or created_by_profile_id = app.current_profile_id());

drop policy if exists student_guardians_read_policy on public.student_guardians;
create policy student_guardians_read_policy on public.student_guardians
for select
to authenticated
using (
	app.can_view_student(student_id)
	or parent_profile_id = app.current_profile_id()
);

drop policy if exists student_guardians_write_policy on public.student_guardians;
create policy student_guardians_write_policy on public.student_guardians
for all
to authenticated
using (
	app.can_manage_student(student_id)
	or parent_profile_id = app.current_profile_id()
)
with check (
	app.can_manage_student(student_id)
	or parent_profile_id = app.current_profile_id()
);

drop policy if exists student_documents_read_policy on public.student_documents;
create policy student_documents_read_policy on public.student_documents
for select
to authenticated
using (app.can_view_student(student_id));

drop policy if exists student_documents_write_policy on public.student_documents;
create policy student_documents_write_policy on public.student_documents
for all
to authenticated
using (app.can_manage_student(student_id) or app.is_linked_parent(student_id))
with check (app.can_manage_student(student_id) or app.is_linked_parent(student_id));

drop policy if exists identity_documents_read_policy on public.identity_documents;
create policy identity_documents_read_policy on public.identity_documents
for select
to authenticated
using (
	app.is_superadmin()
	or owner_profile_id = app.current_profile_id()
	or (student_id is not null and app.can_view_student(student_id))
	or (school_id is not null and app.has_school_management_role(school_id))
);

drop policy if exists identity_documents_write_policy on public.identity_documents;
create policy identity_documents_write_policy on public.identity_documents
for all
to authenticated
using (
	app.is_superadmin()
	or uploaded_by_profile_id = app.current_profile_id()
	or (school_id is not null and app.has_school_management_role(school_id))
)
with check (
	app.is_superadmin()
	or uploaded_by_profile_id = app.current_profile_id()
	or (school_id is not null and app.has_school_management_role(school_id))
);

drop policy if exists student_pickup_contacts_read_policy on public.student_pickup_contacts;
create policy student_pickup_contacts_read_policy on public.student_pickup_contacts
for select
to authenticated
using (app.can_view_student(student_id));

drop policy if exists student_pickup_contacts_write_policy on public.student_pickup_contacts;
create policy student_pickup_contacts_write_policy on public.student_pickup_contacts
for all
to authenticated
using (app.can_manage_student(student_id) or app.is_linked_parent(student_id))
with check (app.can_manage_student(student_id) or app.is_linked_parent(student_id));

drop policy if exists student_pickup_authorizations_read_policy on public.student_pickup_authorizations;
create policy student_pickup_authorizations_read_policy on public.student_pickup_authorizations
for select
to authenticated
using (app.can_view_student(student_id));

drop policy if exists student_pickup_authorizations_write_policy on public.student_pickup_authorizations;
create policy student_pickup_authorizations_write_policy on public.student_pickup_authorizations
for all
to authenticated
using (app.can_manage_student(student_id) or app.is_linked_parent(student_id))
with check (app.can_manage_student(student_id) or app.is_linked_parent(student_id));

drop policy if exists student_pickup_audit_logs_read_policy on public.student_pickup_audit_logs;
create policy student_pickup_audit_logs_read_policy on public.student_pickup_audit_logs
for select
to authenticated
using (app.can_view_student(student_id));

drop policy if exists student_pickup_audit_logs_insert_policy on public.student_pickup_audit_logs;
create policy student_pickup_audit_logs_insert_policy on public.student_pickup_audit_logs
for insert
to authenticated
with check (app.can_manage_student(student_id) or app.is_linked_parent(student_id));

drop policy if exists academic_classes_read_policy on public.academic_classes;
create policy academic_classes_read_policy on public.academic_classes
for select
to authenticated
using (app.has_school_staff_role(school_id));

drop policy if exists academic_classes_write_policy on public.academic_classes;
create policy academic_classes_write_policy on public.academic_classes
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists teacher_class_assignments_read_policy on public.teacher_class_assignments;
create policy teacher_class_assignments_read_policy on public.teacher_class_assignments
for select
to authenticated
using (app.has_school_staff_role(school_id));

drop policy if exists teacher_class_assignments_write_policy on public.teacher_class_assignments;
create policy teacher_class_assignments_write_policy on public.teacher_class_assignments
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists announcements_read_policy on public.announcements;
create policy announcements_read_policy on public.announcements
for select
to authenticated
using (app.can_access_school(school_id));

drop policy if exists announcements_write_policy on public.announcements;
create policy announcements_write_policy on public.announcements
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists notification_campaigns_read_policy on public.notification_campaigns;
create policy notification_campaigns_read_policy on public.notification_campaigns
for select
to authenticated
using (app.can_access_school(school_id));

drop policy if exists notification_campaigns_write_policy on public.notification_campaigns;
create policy notification_campaigns_write_policy on public.notification_campaigns
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists notification_deliveries_read_policy on public.notification_deliveries;
create policy notification_deliveries_read_policy on public.notification_deliveries
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or app.has_school_staff_role(school_id)
);

drop policy if exists notification_deliveries_write_policy on public.notification_deliveries;
create policy notification_deliveries_write_policy on public.notification_deliveries
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists media_assets_read_policy on public.media_assets;
create policy media_assets_read_policy on public.media_assets
for select
to authenticated
using (
	(school_id is not null and app.can_access_school(school_id))
	or app.is_superadmin()
);

drop policy if exists media_assets_write_policy on public.media_assets;
create policy media_assets_write_policy on public.media_assets
for all
to authenticated
using (
	(school_id is not null and app.has_school_management_role(school_id))
	or created_by_profile_id = app.current_profile_id()
	or app.is_superadmin()
)
with check (
	(school_id is not null and app.has_school_management_role(school_id))
	or created_by_profile_id = app.current_profile_id()
	or app.is_superadmin()
);

drop policy if exists calendars_read_policy on public.calendars;
create policy calendars_read_policy on public.calendars
for select
to authenticated
using (app.can_access_school(school_id));

drop policy if exists calendars_write_policy on public.calendars;
create policy calendars_write_policy on public.calendars
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists calendar_events_read_policy on public.calendar_events;
create policy calendar_events_read_policy on public.calendar_events
for select
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = calendar_events.calendar_id
			and app.can_access_school(c.school_id)
	)
);

drop policy if exists calendar_events_write_policy on public.calendar_events;
create policy calendar_events_write_policy on public.calendar_events
for all
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = calendar_events.calendar_id
			and app.has_school_management_role(c.school_id)
	)
)
with check (
	exists (
		select 1
		from public.calendars c
		where c.id = calendar_events.calendar_id
			and app.has_school_management_role(c.school_id)
	)
);

drop policy if exists availability_rules_read_policy on public.availability_rules;
create policy availability_rules_read_policy on public.availability_rules
for select
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = availability_rules.calendar_id
			and app.can_access_school(c.school_id)
	)
);

drop policy if exists availability_rules_write_policy on public.availability_rules;
create policy availability_rules_write_policy on public.availability_rules
for all
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = availability_rules.calendar_id
			and app.has_school_management_role(c.school_id)
	)
)
with check (
	exists (
		select 1
		from public.calendars c
		where c.id = availability_rules.calendar_id
			and app.has_school_management_role(c.school_id)
	)
);

drop policy if exists appointment_slots_read_policy on public.appointment_slots;
create policy appointment_slots_read_policy on public.appointment_slots
for select
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = appointment_slots.calendar_id
			and app.can_access_school(c.school_id)
	)
);

drop policy if exists appointment_slots_write_policy on public.appointment_slots;
create policy appointment_slots_write_policy on public.appointment_slots
for all
to authenticated
using (
	exists (
		select 1
		from public.calendars c
		where c.id = appointment_slots.calendar_id
			and app.has_school_management_role(c.school_id)
	)
)
with check (
	exists (
		select 1
		from public.calendars c
		where c.id = appointment_slots.calendar_id
			and app.has_school_management_role(c.school_id)
	)
);

drop policy if exists guest_tour_requests_insert_public_policy on public.guest_tour_requests;
create policy guest_tour_requests_insert_public_policy on public.guest_tour_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists guest_tour_requests_read_policy on public.guest_tour_requests;
create policy guest_tour_requests_read_policy on public.guest_tour_requests
for select
to authenticated
using (app.has_school_staff_role(school_id));

drop policy if exists guest_tour_requests_manage_policy on public.guest_tour_requests;
create policy guest_tour_requests_manage_policy on public.guest_tour_requests
for update
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists appointments_read_policy on public.appointments;
create policy appointments_read_policy on public.appointments
for select
to authenticated
using (
	app.has_school_staff_role(school_id)
	or requester_profile_id = app.current_profile_id()
	or (student_id is not null and app.is_linked_parent(student_id))
);

drop policy if exists appointments_write_policy on public.appointments;
create policy appointments_write_policy on public.appointments
for all
to authenticated
using (
	app.has_school_management_role(school_id)
	or requester_profile_id = app.current_profile_id()
)
with check (
	app.has_school_management_role(school_id)
	or requester_profile_id = app.current_profile_id()
);

drop policy if exists appointment_notes_read_policy on public.appointment_notes;
create policy appointment_notes_read_policy on public.appointment_notes
for select
to authenticated
using (
	exists (
		select 1
		from public.appointments a
		where a.id = appointment_notes.appointment_id
			and (
				app.has_school_staff_role(a.school_id)
				or (a.student_id is not null and app.is_linked_parent(a.student_id) and appointment_notes.is_internal = false)
			)
	)
);

drop policy if exists appointment_notes_write_policy on public.appointment_notes;
create policy appointment_notes_write_policy on public.appointment_notes
for all
to authenticated
using (
	exists (
		select 1
		from public.appointments a
		where a.id = appointment_notes.appointment_id
			and app.has_school_staff_role(a.school_id)
	)
)
with check (
	exists (
		select 1
		from public.appointments a
		where a.id = appointment_notes.appointment_id
			and app.has_school_staff_role(a.school_id)
	)
);

drop policy if exists threads_read_policy on public.threads;
create policy threads_read_policy on public.threads
for select
to authenticated
using (
	app.is_superadmin()
	or app.is_thread_participant(id)
	or app.has_school_staff_role(school_id)
);

drop policy if exists threads_write_policy on public.threads;
create policy threads_write_policy on public.threads
for all
to authenticated
using (
	created_by_profile_id = app.current_profile_id()
	or app.has_school_staff_role(school_id)
)
with check (
	created_by_profile_id = app.current_profile_id()
	or app.has_school_staff_role(school_id)
);

drop policy if exists thread_participants_read_policy on public.thread_participants;
create policy thread_participants_read_policy on public.thread_participants
for select
to authenticated
using (
	profile_id = app.current_profile_id()
	or exists (
		select 1
		from public.threads t
		where t.id = thread_participants.thread_id
			and app.has_school_staff_role(t.school_id)
	)
);

drop policy if exists thread_participants_write_policy on public.thread_participants;
create policy thread_participants_write_policy on public.thread_participants
for all
to authenticated
using (
	profile_id = app.current_profile_id()
	or exists (
		select 1
		from public.threads t
		where t.id = thread_participants.thread_id
			and app.has_school_staff_role(t.school_id)
	)
)
with check (
	profile_id = app.current_profile_id()
	or exists (
		select 1
		from public.threads t
		where t.id = thread_participants.thread_id
			and app.has_school_staff_role(t.school_id)
	)
);

drop policy if exists messages_read_policy on public.messages;
create policy messages_read_policy on public.messages
for select
to authenticated
using (
	app.is_superadmin()
	or app.is_thread_participant(thread_id)
	or exists (
		select 1
		from public.threads t
		where t.id = messages.thread_id
			and app.has_school_staff_role(t.school_id)
	)
);

drop policy if exists messages_insert_policy on public.messages;
create policy messages_insert_policy on public.messages
for insert
to authenticated
with check (
	sender_profile_id = app.current_profile_id()
	and (
		app.is_thread_participant(thread_id)
		or exists (
			select 1
			from public.threads t
			where t.id = messages.thread_id
				and app.has_school_staff_role(t.school_id)
		)
	)
);

drop policy if exists student_tuition_accounts_read_policy on public.student_tuition_accounts;
create policy student_tuition_accounts_read_policy on public.student_tuition_accounts
for select
to authenticated
using (
	app.has_school_staff_role(school_id)
	or app.is_linked_parent(student_id)
);

drop policy if exists student_tuition_accounts_write_policy on public.student_tuition_accounts;
create policy student_tuition_accounts_write_policy on public.student_tuition_accounts
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

drop policy if exists tuition_periods_read_policy on public.tuition_periods;
create policy tuition_periods_read_policy on public.tuition_periods
for select
to authenticated
using (
	exists (
		select 1
		from public.student_tuition_accounts sta
		where sta.id = tuition_periods.tuition_account_id
			and (app.has_school_staff_role(sta.school_id) or app.is_linked_parent(sta.student_id))
	)
);

drop policy if exists tuition_periods_write_policy on public.tuition_periods;
create policy tuition_periods_write_policy on public.tuition_periods
for all
to authenticated
using (
	exists (
		select 1
		from public.student_tuition_accounts sta
		where sta.id = tuition_periods.tuition_account_id
			and app.has_school_management_role(sta.school_id)
	)
)
with check (
	exists (
		select 1
		from public.student_tuition_accounts sta
		where sta.id = tuition_periods.tuition_account_id
			and app.has_school_management_role(sta.school_id)
	)
);

drop policy if exists tuition_quotes_read_policy on public.tuition_quotes;
create policy tuition_quotes_read_policy on public.tuition_quotes
for select
to authenticated
using (
	exists (
		select 1
		from public.tuition_periods tp
		join public.student_tuition_accounts sta on sta.id = tp.tuition_account_id
		where tp.id = tuition_quotes.tuition_period_id
			and (app.has_school_staff_role(sta.school_id) or app.is_linked_parent(sta.student_id))
	)
);

drop policy if exists tuition_quotes_write_policy on public.tuition_quotes;
create policy tuition_quotes_write_policy on public.tuition_quotes
for all
to authenticated
using (
	exists (
		select 1
		from public.tuition_periods tp
		join public.student_tuition_accounts sta on sta.id = tp.tuition_account_id
		where tp.id = tuition_quotes.tuition_period_id
			and app.has_school_management_role(sta.school_id)
	)
)
with check (
	exists (
		select 1
		from public.tuition_periods tp
		join public.student_tuition_accounts sta on sta.id = tp.tuition_account_id
		where tp.id = tuition_quotes.tuition_period_id
			and app.has_school_management_role(sta.school_id)
	)
);

drop policy if exists payment_records_read_policy on public.payment_records;
create policy payment_records_read_policy on public.payment_records
for select
to authenticated
using (
	app.has_school_staff_role(school_id)
	or app.is_linked_parent(student_id)
);

drop policy if exists payment_records_write_policy on public.payment_records;
create policy payment_records_write_policy on public.payment_records
for all
to authenticated
using (app.has_school_management_role(school_id))
with check (app.has_school_management_role(school_id));

commit;