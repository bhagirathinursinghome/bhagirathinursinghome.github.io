-- ============================================================
-- Bhagirathy Nursing Home — Supabase setup
-- Run this ONCE in your Supabase SQL Editor before using the app.
-- ============================================================

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mobile text,
  username text not null unique,
  password_hash text not null,
  password_salt text not null,
  role text,                            -- admin / accountant / reception / ot / pharmacy / lab / manager / viewer / other
  status text not null default 'pending', -- pending / active / deactivated
  created_at timestamptz not null default now()
);

-- Grants for the publishable (anon) key used by the static site.
grant select, insert, update on public.app_users to anon;
grant select, insert, update on public.app_users to authenticated;
grant all on public.app_users to service_role;

-- IMPORTANT: This app uses a custom (non-Supabase-Auth) login.
-- We rely on the publishable key and keep RLS DISABLED on this table
-- so the static site can read/write the row directly.
-- If you want stricter access, move the logic to an Edge Function.
alter table public.app_users disable row level security;

-- Example "stamped" table for data entry pages (optional, for reference):
-- create table if not exists public.sample_entries (
--   id uuid primary key default gen_random_uuid(),
--   patient_name text,
--   note text,
--   recorded_by text,
--   recorded_by_name text,
--   recorded_at timestamptz default now()
-- );
-- grant select, insert on public.sample_entries to anon, authenticated;
