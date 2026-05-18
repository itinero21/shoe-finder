-- NUCLEAR CLEAN RESET: Drop and recreate everything fresh.
-- Run this ONCE. It handles everything.

-- Drop old broken tables (cascade removes any attached policies)
drop table if exists public.shoe_choices cascade;
drop table if exists public.run_paths cascade;
drop table if exists public.territory_cities cascade;
drop view if exists public.shoe_choices_aggregate cascade;
drop materialized view if exists public.shoe_choices_aggregate cascade;

-- Create shoe_choices
create table public.shoe_choices (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  shoe_id    text   not null,
  chosen_at  timestamptz not null default now(),
  primary key (user_id, shoe_id)
);
alter table public.shoe_choices enable row level security;
alter table public.shoe_choices force row level security;
create index shoe_choices_shoe on public.shoe_choices(shoe_id);

-- Create run_paths
create table public.run_paths (
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
create index paths_user_id on public.run_paths(user_id);

-- Create territory_cities
create table public.territory_cities (
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

-- Create aggregate view
create view public.shoe_choices_aggregate as
  select shoe_id, count(distinct user_id)::integer as user_count
  from public.shoe_choices
  group by shoe_id
  order by user_count desc;
grant select on public.shoe_choices_aggregate to authenticated;
