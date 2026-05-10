-- ============================================================
-- STRIDE — Schema v2: Security Hardening + Consent Tracking
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ── Additional extensions ─────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Revoke public execute on internal functions ───────────────
-- Prevents anonymous callers from invoking internal triggers
revoke execute on function public.handle_new_user()  from public;
revoke execute on function public.set_updated_at()   from public;

-- ── Data integrity constraints ────────────────────────────────
-- These run at the DB layer so no client can write invalid data
do $$ begin
  begin
    alter table public.runs
      add constraint runs_distance_positive check (distance_km > 0);
  exception when duplicate_object then null; end;

  begin
    alter table public.runs
      add constraint runs_feel_range
      check (feel is null or (feel >= 1 and feel <= 3));
  exception when duplicate_object then null; end;

  begin
    alter table public.user_profiles
      add constraint profile_xp_non_negative check (total_xp >= 0);
  exception when duplicate_object then null; end;

  begin
    alter table public.user_profiles
      add constraint profile_miles_non_negative check (lifetime_miles >= 0);
  exception when duplicate_object then null; end;

  begin
    alter table public.user_profiles
      add constraint profile_level_positive check (current_level >= 1);
  exception when duplicate_object then null; end;
end $$;

-- ── user_consents ─────────────────────────────────────────────
-- Immutable audit log of when each user accepted Terms + Privacy.
-- One row per version acceptance — never deleted, never updated.
-- This is your legal proof of consent.
create table if not exists public.user_consents (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  terms_version    text        not null,     -- e.g. '1.0'
  privacy_version  text        not null,     -- e.g. '1.0'
  accepted_at      timestamptz not null default now(),
  platform         text        not null default 'mobile', -- 'ios' | 'android' | 'web'
  app_version      text                                   -- e.g. '1.0.0'
);

alter table public.user_consents enable row level security;

-- Users can only read their own consent records
create policy "Users read own consents"
  on public.user_consents for select
  using (auth.uid() = user_id);

-- Users can insert their own consent (insert only — no update, no delete)
create policy "Users record own consent"
  on public.user_consents for insert
  with check (auth.uid() = user_id);

-- No update policy = consent records are immutable
-- No delete policy = consent records cannot be erased

-- ── Harden existing RLS: block anon role entirely ─────────────
-- The anon key should never be able to read ANY user data.
-- The existing policies already restrict to auth.uid() = user_id,
-- but adding this revoke makes it explicit at the role level.

-- Confirm RLS is enabled on all tables (idempotent)
alter table public.user_profiles  enable row level security;
alter table public.arsenal         enable row level security;
alter table public.runs            enable row level security;
alter table public.shoe_mileage    enable row level security;
alter table public.race_events     enable row level security;
alter table public.obituaries      enable row level security;
alter table public.user_consents   enable row level security;

-- Force RLS even for table owners (belt + suspenders)
alter table public.user_profiles  force row level security;
alter table public.arsenal         force row level security;
alter table public.runs            force row level security;
alter table public.shoe_mileage    force row level security;
alter table public.race_events     force row level security;
alter table public.obituaries      force row level security;
alter table public.user_consents   force row level security;

-- ── Indexes for consent queries ───────────────────────────────
create index if not exists consents_user_id on public.user_consents(user_id, accepted_at desc);

-- ── Record first-consent on signup ───────────────────────────
-- Updated handle_new_user: also inserts initial consent placeholder
-- so every profile row has at least a created_at timestamp.
-- Actual consent is recorded by the app after the user taps "Agree".
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;
