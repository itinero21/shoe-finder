-- STEP 2: Create new tables
-- If tables already exist from a prior attempt, this is safe to re-run.

-- Clean up any leftover policies from failed prior runs
do $$ begin
  execute 'drop policy if exists "Users read all shoe choices" on public.shoe_choices';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Users insert own shoe choices" on public.shoe_choices';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Users read own paths" on public.run_paths';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Users insert own paths" on public.run_paths';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Users update own paths" on public.run_paths';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Anyone can read cities" on public.territory_cities';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Authenticated users can insert cities" on public.territory_cities';
exception when undefined_table then null; end $$;

do $$ begin
  execute 'drop policy if exists "Authenticated users can update cities" on public.territory_cities';
exception when undefined_table then null; end $$;

-- Now create tables
create table if not exists public.shoe_choices (
  user_id    uuid   not null references auth.users(id) on delete cascade,
  shoe_id    text   not null,
  chosen_at  timestamptz not null default now(),
  primary key (user_id, shoe_id)
);

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
