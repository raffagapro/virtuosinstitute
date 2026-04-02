-- Virtuos Institute
-- Migration 004: Storage Metadata
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create table if not exists public.identity_documents (
	id uuid primary key default gen_random_uuid(),
	school_id uuid references public.schools (id) on delete cascade,
	owner_profile_id uuid references public.profiles (id) on delete set null,
	student_id uuid references public.students (id) on delete set null,
	pickup_contact_id uuid references public.student_pickup_contacts (id) on delete set null,
	storage_bucket text not null,
	document_type text not null,
	storage_path text not null,
	mime_type text not null,
	byte_size bigint not null,
	checksum_sha256 text,
	uploaded_by_profile_id uuid references public.profiles (id) on delete set null,
	verification_status text not null default 'pending',
	verified_by_profile_id uuid references public.profiles (id) on delete set null,
	verified_at timestamptz,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint identity_documents_storage_bucket_valid check (storage_bucket = 'identity-documents'),
	constraint identity_documents_document_type_valid check (
		document_type in ('ine', 'passport', 'pickup_id', 'signed_authorization', 'other')
	),
	constraint identity_documents_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
	constraint identity_documents_byte_size_positive check (byte_size > 0),
	constraint identity_documents_verification_status_valid check (
		verification_status in ('pending', 'verified', 'rejected', 'revoked')
	),
	constraint identity_documents_verified_fields_consistent check (
		(verification_status = 'verified' and verified_at is not null)
		or verification_status <> 'verified'
	)
);

create unique index if not exists identity_documents_bucket_path_unique_idx
	on public.identity_documents (storage_bucket, storage_path);

create index if not exists identity_documents_school_idx
	on public.identity_documents (school_id, document_type, verification_status);

create index if not exists identity_documents_owner_idx
	on public.identity_documents (owner_profile_id, created_at desc);

create index if not exists identity_documents_student_idx
	on public.identity_documents (student_id, created_at desc)
	where student_id is not null;

create index if not exists identity_documents_pickup_contact_idx
	on public.identity_documents (pickup_contact_id, created_at desc)
	where pickup_contact_id is not null;

create table if not exists public.student_documents (
	id uuid primary key default gen_random_uuid(),
	school_id uuid not null references public.schools (id) on delete cascade,
	student_id uuid not null references public.students (id) on delete cascade,
	document_type text not null,
	status text not null default 'missing',
	identity_document_id uuid references public.identity_documents (id) on delete set null,
	storage_bucket text,
	storage_path text,
	mime_type text,
	byte_size bigint,
	uploaded_by_profile_id uuid references public.profiles (id) on delete set null,
	reviewed_by_profile_id uuid references public.profiles (id) on delete set null,
	reviewed_at timestamptz,
	notes text,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint student_documents_document_type_not_blank check (char_length(trim(document_type)) > 0),
	constraint student_documents_status_valid check (
		status in ('missing', 'submitted', 'approved', 'rejected')
	),
	constraint student_documents_storage_bucket_valid check (
		storage_bucket is null or storage_bucket = 'student-files'
	),
	constraint student_documents_storage_path_if_bucket check (
		storage_bucket is null or (storage_path is not null and char_length(trim(storage_path)) > 0)
	),
	constraint student_documents_byte_size_positive check (byte_size is null or byte_size > 0),
	constraint student_documents_review_fields_consistent check (
		reviewed_at is null or reviewed_by_profile_id is not null
	),
	constraint student_documents_unique_type_per_student unique (student_id, document_type)
);

create unique index if not exists student_documents_bucket_path_unique_idx
	on public.student_documents (storage_bucket, storage_path)
	where storage_bucket is not null and storage_path is not null;

create index if not exists student_documents_school_status_idx
	on public.student_documents (school_id, status, document_type);

create index if not exists student_documents_student_status_idx
	on public.student_documents (student_id, status);

create table if not exists public.media_assets (
	id uuid primary key default gen_random_uuid(),
	school_id uuid references public.schools (id) on delete cascade,
	student_id uuid references public.students (id) on delete set null,
	storage_bucket text not null,
	kind text not null,
	storage_path text not null,
	mime_type text not null,
	byte_size bigint not null,
	created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint media_assets_storage_bucket_valid check (
		storage_bucket in ('student-files', 'notification-media')
	),
	constraint media_assets_kind_valid check (
		kind in ('banner_image', 'grade_pdf', 'evaluation_pdf', 'document_upload', 'announcement_attachment')
	),
	constraint media_assets_storage_path_not_blank check (char_length(trim(storage_path)) > 0),
	constraint media_assets_byte_size_positive check (byte_size > 0)
);

create unique index if not exists media_assets_bucket_path_unique_idx
	on public.media_assets (storage_bucket, storage_path);

create index if not exists media_assets_school_kind_idx
	on public.media_assets (school_id, kind, created_at desc);

create index if not exists media_assets_student_kind_idx
	on public.media_assets (student_id, kind, created_at desc)
	where student_id is not null;

create index if not exists media_assets_creator_idx
	on public.media_assets (created_by_profile_id, created_at desc);

alter table public.parent_profiles
	add constraint parent_profiles_government_id_document_fk
	foreign key (government_id_document_id)
	references public.identity_documents (id)
	on delete set null;

alter table public.staff_profiles
	add constraint staff_profiles_government_id_document_fk
	foreign key (government_id_document_id)
	references public.identity_documents (id)
	on delete set null;

alter table public.student_pickup_contacts
	add column if not exists id_document_id uuid;

alter table public.student_pickup_contacts
	add constraint student_pickup_contacts_id_document_fk
	foreign key (id_document_id)
	references public.identity_documents (id)
	on delete set null;

alter table public.student_pickup_authorizations
	add column if not exists authorization_document_id uuid;

alter table public.student_pickup_authorizations
	add constraint student_pickup_authorizations_document_fk
	foreign key (authorization_document_id)
	references public.identity_documents (id)
	on delete set null;

drop trigger if exists trg_identity_documents_set_updated_at on public.identity_documents;
create trigger trg_identity_documents_set_updated_at
before update on public.identity_documents
for each row
execute function app.set_updated_at();

drop trigger if exists trg_student_documents_set_updated_at on public.student_documents;
create trigger trg_student_documents_set_updated_at
before update on public.student_documents
for each row
execute function app.set_updated_at();

drop trigger if exists trg_media_assets_set_updated_at on public.media_assets;
create trigger trg_media_assets_set_updated_at
before update on public.media_assets
for each row
execute function app.set_updated_at();

commit;