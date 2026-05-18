drop table if exists public.shoe_choices cascade;
drop table if exists public.run_paths cascade;
drop table if exists public.territory_cities cascade;
drop view if exists public.shoe_choices_aggregate cascade;

create table public.shoe_choices (
  user_id uuid not null references auth.users(id) on delete cascade,
  shoe_id text not null,
  chosen_at timestamptz not null default now(),
  primary key (user_id, shoe_id)
);

create table public.run_paths (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  distance_km numeric,
  city text,
  heat text,
  run_count integer not null default 0,
  last_run_at timestamptz,
  coordinates jsonb,
  updated_at timestamptz not null default now()
);

create table public.territory_cities (
  id text primary key,
  name text not null,
  country text,
  lat numeric,
  lng numeric,
  radius_km numeric,
  active_runner_count integer not null default 0,
  popular_shoes jsonb,
  updated_at timestamptz not null default now()
);
