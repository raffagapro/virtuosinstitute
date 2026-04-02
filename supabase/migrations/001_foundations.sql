-- Virtuos Institute
-- Migration 001: Foundations
-- Reference: docs/SQL_MIGRATION_PLAN.md

begin;

create extension if not exists pgcrypto;

create schema if not exists app;

create or replace function app.current_profile_id()
returns uuid
language sql
stable
set search_path = ''
as $$
	select auth.uid();
$$;

create or replace function app.current_jwt_claim(claim_key text)
returns text
language sql
stable
set search_path = ''
as $$
	select auth.jwt() ->> claim_key;
$$;

create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

commit;