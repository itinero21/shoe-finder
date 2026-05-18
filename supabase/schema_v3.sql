-- ============================================================
-- STRIDE — Schema v3: Complete Data Coverage
-- Run each numbered section separately in the Supabase SQL Editor.
-- ============================================================


-- ████ SECTION 1: Add missing columns ████
-- Run this first.

do $$ begin
  begin alter table public.user_profiles add column weight_lbs numeric not null default 160;
  exception when duplicate_column then null; end;
  begin alter table public.user_profiles add column arch_type text;
  exception when duplicate_column then null; end;
end $$;

do $$ begin
  begin alter table public.runs add column strava_gear_id text;
  exception when duplicate_column then null; end;
  begin alter table public.runs add column coordinates jsonb;
  exception when duplicate_column then null; end;
  begin alter table public.runs add column path_id text;
  exception when duplicate_column then null; end;
end $$;

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

do $$ begin
  alter table public.obituaries add constraint obituaries_user_shoe unique (user_id, shoe_id);
exception when duplicate_object then null; end $$;

create index if not exists runs_external_id on public.runs(external_id) where external_id is not null;
create index if not exists runs_coordinates on public.runs(user_id) where coordinates is not null;
create index if not exists obituaries_user_id on public.obituaries(user_id);


-- ████ SECTION 2: shoe_choices table ████
-- Run this second.

create table if not exists public.shoe_choices (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  shoe_id    text   not null,
  chosen_at  timestamptz not null default now(),
  primary key (user_id, shoe_id)
);

alter table public.shoe_choices enable row level security;
alter table public.shoe_choices force row level security;

create index if not exists shoe_choices_shoe on public.shoe_choices(shoe_id);


-- ████ SECTION 3: shoe_choices policies ████
-- Run this third.

drop policy if exists "Users read all shoe choices" on public.shoe_choices;
create policy "Users read all shoe choices"
  on public.shoe_choices for select using (true);

drop policy if exists "Users insert own shoe choices" on public.shoe_choices;
create policy "Users insert own shoe choices"
  on public.shoe_choices for insert with check (auth.uid() = user_id);


-- ████ SECTION 4: shoe_choices_aggregate view ████
-- Run this fourth.

drop view if exists public.shoe_choices_aggregate cascade;
drop materialized view if exists public.shoe_choices_aggregate cascade;

create view public.shoe_choices_aggregate as
  select shoe_id, count(distinct user_id)::integer as user_count
  from public.shoe_choices
  group by shoe_id
  order by user_count desc;

grant select on public.shoe_choices_aggregate to authenticated;


-- ████ SECTION 5: run_paths table ████
-- Run this fifth.

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

create index if not exists paths_user_id on public.run_paths(user_id);


-- ████ SECTION 6: run_paths policies ████
-- Run this sixth.

drop policy if exists "Users read own paths" on public.run_paths;
create policy "Users read own paths"
  on public.run_paths for select using (auth.uid() = user_id);

drop policy if exists "Users insert own paths" on public.run_paths;
create policy "Users insert own paths"
  on public.run_paths for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own paths" on public.run_paths;
create policy "Users update own paths"
  on public.run_paths for update using (auth.uid() = user_id);


-- ████ SECTION 7: territory_cities table ████
-- Run this seventh.

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


-- ████ SECTION 8: territory_cities policies ████
-- Run this eighth.

drop policy if exists "Anyone can read cities" on public.territory_cities;
create policy "Anyone can read cities"
  on public.territory_cities for select using (true);

drop policy if exists "Authenticated users can insert cities" on public.territory_cities;
create policy "Authenticated users can insert cities"
  on public.territory_cities for insert with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update cities" on public.territory_cities;
create policy "Authenticated users can update cities"
  on public.territory_cities for update using (auth.uid() is not null);


-- ████ SECTION 9: obituaries update policy ████
-- Run this last.

drop policy if exists "Users update own obituaries" on public.obituaries;
create policy "Users update own obituaries"
  on public.obituaries for update using (auth.uid() = user_id);
