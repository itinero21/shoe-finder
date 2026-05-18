-- ============================================================
-- STRIDE — Schema v3: Complete Data Coverage
-- Run this in the Supabase SQL Editor AFTER schema_v2.sql
--
-- Adds:
--   - Missing columns on user_profiles, runs, obituaries
--   - shoe_choices table + aggregate view (leaderboard)
--   - run_paths table (DRIFT territory GPS traces)
--   - territory_cities table (DRIFT city data)
--   - graveyard table (full obituary data)
-- ============================================================

-- ── 1. user_profiles — add missing columns ───────────────────
do $$ begin
  begin alter table public.user_profiles add column weight_lbs numeric not null default 160;
  exception when duplicate_column then null; end;
  begin alter table public.user_profiles add column arch_type text;
  exception when duplicate_column then null; end;
end $$;

-- ── 2. runs — add missing columns ───────────────────────────
do $$ begin
  begin alter table public.runs add column strava_gear_id text;
  exception when duplicate_column then null; end;
  begin alter table public.runs add column coordinates jsonb;
  exception when duplicate_column then null; end;
  begin alter table public.runs add column path_id text;
  exception when duplicate_column then null; end;
end $$;

-- ── 3. obituaries — expand to full ShoeObituary fields ──────
-- The v1 table only had shoe_id, total_km, eulogy, retired_at.
-- We need all the fields the app actually writes.
do $$ begin
  begin alter table public.obituaries add column brand text;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column model text;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column total_miles numeric not null default 0;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column days_in_service integer not null default 0;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column added_date text;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column memorable_run text;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column best_moment text;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column rating smallint not null default 4;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column would_buy_again boolean not null default true;
  exception when duplicate_column then null; end;
  begin alter table public.obituaries add column epitaph text;
  exception when duplicate_column then null; end;
end $$;

-- Unique constraint for upsert support
do $$ begin
  alter table public.obituaries add constraint obituaries_user_shoe unique (user_id, shoe_id);
exception when duplicate_object then null; end $$;

-- Allow users to update their own obituaries (for editing epitaphs)
do $$ begin
  execute 'create policy "Users update own obituaries"
    on public.obituaries for update using (auth.uid() = user_id)';
exception when duplicate_object then null; end $$;

-- ── 4. shoe_choices — leaderboard / popularity tracking ──────
create table if not exists public.shoe_choices (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  shoe_id    text   not null,
  chosen_at  timestamptz not null default now(),
  primary key (user_id, shoe_id)
);

alter table public.shoe_choices enable row level security;
alter table public.shoe_choices force row level security;

do $$ begin
  execute 'create policy "Users read all shoe choices"
    on public.shoe_choices for select using (true)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy "Users insert own shoe choices"
    on public.shoe_choices for insert with check (auth.uid() = user_id)';
exception when duplicate_object then null; end $$;

-- Materialized view for aggregate counts (used by leaderboard)
create materialized view if not exists public.shoe_choices_aggregate as
  select shoe_id, count(distinct user_id)::integer as user_count
  from public.shoe_choices
  group by shoe_id
  order by user_count desc;

-- Grant read access to authenticated users
grant select on public.shoe_choices_aggregate to authenticated;

-- ── 5. run_paths — DRIFT territory GPS traces ───────────────
create table if not exists public.run_paths (
  id           text        primary key,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text,
  distance_km  numeric,
  city         text,
  heat         text,
  run_count    integer     not null default 0,
  last_run_at  timestamptz,
  coordinates  jsonb,
  updated_at   timestamptz not null default now()
);

alter table public.run_paths enable row level security;
alter table public.run_paths force row level security;

do $$ begin
  execute 'create policy "Users read own paths"
    on public.run_paths for select using (auth.uid() = user_id)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy "Users insert own paths"
    on public.run_paths for insert with check (auth.uid() = user_id)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy "Users update own paths"
    on public.run_paths for update using (auth.uid() = user_id)';
exception when duplicate_object then null; end $$;

-- ── 6. territory_cities — DRIFT city data ───────────────────
create table if not exists public.territory_cities (
  id                  text primary key,
  name                text not null,
  country             text,
  lat                 numeric,
  lng                 numeric,
  radius_km           numeric,
  active_runner_count integer not null default 0,
  popular_shoes       jsonb,
  updated_at          timestamptz not null default now()
);

alter table public.territory_cities enable row level security;
alter table public.territory_cities force row level security;

-- Cities are publicly readable (for map display) but only insertable/updatable by authenticated
do $$ begin
  execute 'create policy "Anyone can read cities"
    on public.territory_cities for select using (true)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy "Authenticated users can insert cities"
    on public.territory_cities for insert with check (auth.uid() is not null)';
exception when duplicate_object then null; end $$;

do $$ begin
  execute 'create policy "Authenticated users can update cities"
    on public.territory_cities for update using (auth.uid() is not null)';
exception when duplicate_object then null; end $$;

-- ── 7. Indexes for performance ───────────────────────────────
create index if not exists runs_external_id on public.runs(external_id) where external_id is not null;
create index if not exists runs_coordinates on public.runs(user_id) where coordinates is not null;
create index if not exists paths_user_id on public.run_paths(user_id);
create index if not exists obituaries_user_id on public.obituaries(user_id);
create index if not exists shoe_choices_shoe on public.shoe_choices(shoe_id);

-- ── 8. Refresh function for materialized view ───────────────
-- Call this periodically (e.g., via cron or after shoe_choices insert)
create or replace function public.refresh_shoe_choices_aggregate()
returns void language plpgsql security definer as $$
begin
  refresh materialized view public.shoe_choices_aggregate;
end;
$$;
