-- Virtuos Institute
-- Migration 014: Required Profile Fields
-- Adds missing required fields identified from the platform roles specification:
--   parent_profiles  → date_of_birth
--   students         → date_of_birth, data_authorization_signed_at, data_authorization_signed_by_profile_id
--   guest_tour_requests → grade_of_interest

begin;

-- Padre de familia: fecha de nacimiento
alter table public.parent_profiles
  add column if not exists date_of_birth date;

-- Alumno: fecha de nacimiento (needed for enrollment registration)
alter table public.students
  add column if not exists date_of_birth date;

-- Alumno: firma de autorización de uso de datos
alter table public.students
  add column if not exists data_authorization_signed_at timestamptz;

alter table public.students
  add column if not exists data_authorization_signed_by_profile_id uuid
    references public.profiles (id) on delete set null;

-- Invitados / Prospectos: grado de interés (e.g. 'kinder', '1ro primaria', etc.)
alter table public.guest_tour_requests
  add column if not exists grade_of_interest text;

commit;
