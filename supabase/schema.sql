-- ============================================================
-- STRIDE PROTOCOL — Supabase Schema + RLS
-- Run this entire file in the Supabase SQL Editor once.
-- Every table has Row Level Security: users can only ever
-- read and write their own rows. No row is accessible by
-- any other authenticated user, and nothing is accessible
-- to anonymous requests.
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. user_profiles ─────────────────────────────────────────
-- One row per user. Mirrors the UserProfile interface.
create table if not exists public.user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  lifetime_miles        numeric         not null default 0,
  total_xp              integer         not null default 0,
  current_level         integer         not null default 1,
  is_beginner_mode      boolean         not null default true,
  graduated_at          timestamptz,
  quiz_completed_at     timestamptz,
  streak_states         jsonb           not null default '{}'::jsonb,
  active_injury         jsonb,
  injury_history        jsonb           not null default '[]'::jsonb,
  achievements_unlocked text[]          not null default '{}',
  weekly_roster         text[]          not null default '{}',
  weekly_roster_locked  boolean         not null default false,
  week_starting         date,
  graveyard_count       integer         not null default 0,
  strava_tokens         jsonb,          -- encrypted at app layer, stored here for sync
  created_at            timestamptz     not null default now(),
  updated_at            timestamptz     not null default now()
);

alter table public.user_profiles enable row level security;

create policy "Users read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ── 2. arsenal (saved shoes) ──────────────────────────────────
-- Which shoe IDs each user has saved to their Arsenal.
create table if not exists public.arsenal (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  shoe_id    text        not null,   -- references app/data/shoes.ts id field
  added_at   timestamptz not null default now(),
  unique(user_id, shoe_id)
);

alter table public.arsenal enable row level security;

create policy "Users read own arsenal"
  on public.arsenal for select using (auth.uid() = user_id);

create policy "Users insert own arsenal"
  on public.arsenal for insert with check (auth.uid() = user_id);

create policy "Users delete own arsenal"
  on public.arsenal for delete using (auth.uid() = user_id);

-- ── 3. runs ──────────────────────────────────────────────────
-- Every logged run. Mirrors the Run type.
create table if not exists public.runs (
  id               text        primary key,  -- keep client-generated IDs for dedup
  user_id          uuid        not null references auth.users(id) on delete cascade,
  shoe_id          text        not null,
  distance_km      numeric     not null,
  date             timestamptz not null,
  terrain          text,
  purpose          text,
  duration_minutes integer,
  feel             smallint,   -- 1=dead 2=okay 3=fresh
  notes            text,
  match_quality    text,
  xp_earned        integer     not null default 0,
  source           text        not null default 'manual',
  external_id      text,       -- strava / healthkit dedup key
  route_hash       text,
  created_at       timestamptz not null default now()
);

alter table public.runs enable row level security;

create policy "Users read own runs"
  on public.runs for select using (auth.uid() = user_id);

create policy "Users insert own runs"
  on public.runs for insert with check (auth.uid() = user_id);

create policy "Users delete own runs"
  on public.runs for delete using (auth.uid() = user_id);

create index runs_user_date on public.runs(user_id, date desc);
create index runs_shoe on public.runs(user_id, shoe_id);

-- ── 4. shoe_mileage ──────────────────────────────────────────
-- Cached mileage per shoe per user (updated by trigger or app).
create table if not exists public.shoe_mileage (
  user_id    uuid    not null references auth.users(id) on delete cascade,
  shoe_id    text    not null,
  total_km   numeric not null default 0,
  run_count  integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, shoe_id)
);

alter table public.shoe_mileage enable row level security;

create policy "Users read own mileage"
  on public.shoe_mileage for select using (auth.uid() = user_id);

create policy "Users upsert own mileage"
  on public.shoe_mileage for insert with check (auth.uid() = user_id);

create policy "Users update own mileage"
  on public.shoe_mileage for update using (auth.uid() = user_id);

-- ── 5. race_events ───────────────────────────────────────────
create table if not exists public.race_events (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  date       date        not null,
  distance   text        not null,  -- e.g. '5K', 'Half Marathon'
  shoe_id    text,                  -- planned race shoe
  goal_time  text,
  result     jsonb,                 -- filled post-race
  created_at timestamptz not null default now()
);

alter table public.race_events enable row level security;

create policy "Users read own races"
  on public.race_events for select using (auth.uid() = user_id);

create policy "Users insert own races"
  on public.race_events for insert with check (auth.uid() = user_id);

create policy "Users update own races"
  on public.race_events for update using (auth.uid() = user_id);

create policy "Users delete own races"
  on public.race_events for delete using (auth.uid() = user_id);

-- ── 6. obituaries ─────────────────────────────────────────────
create table if not exists public.obituaries (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  shoe_id      text        not null,
  total_km     numeric     not null default 0,
  eulogy       text,
  retired_at   timestamptz not null default now()
);

alter table public.obituaries enable row level security;

create policy "Users read own obituaries"
  on public.obituaries for select using (auth.uid() = user_id);

create policy "Users insert own obituaries"
  on public.obituaries for insert with check (auth.uid() = user_id);

-- ── 7. Auto-create profile on signup ─────────────────────────
-- Triggered by Supabase auth.users insert — creates the profile row
-- immediately so the app never hits a missing-profile state.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, created_at)
  values (new.id, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
