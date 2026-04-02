-- Virtuos Institute
-- Migration 015: Shared Profile Date Of Birth
-- Adds date_of_birth to profiles so all authenticated roles can edit it.

begin;

alter table public.profiles
  add column if not exists date_of_birth date;

commit;