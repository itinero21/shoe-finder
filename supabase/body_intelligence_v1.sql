-- STRIDE BODY INTELLIGENCE v1
-- Provider-neutral physiology storage. Run in the Supabase SQL editor after
-- the base STRIDE schema. Raw second-by-second streams are deliberately kept
-- separate from ordinary run rows.

create table if not exists public.data_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('apple_health', 'garmin', 'strava')),
  status text not null default 'connected' check (status in ('connected', 'expired', 'revoked', 'error')),
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.daily_biometrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  sleep jsonb,
  cardiovascular jsonb,
  activity jsonb,
  recovery jsonb,
  sources text[] not null default '{}',
  observed_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.activity_biometrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  avg_hr numeric,
  max_hr numeric,
  cadence numeric,
  power_watts numeric,
  ground_contact_time_ms numeric,
  vertical_oscillation_cm numeric,
  stride_length_m numeric,
  elevation_gain_m numeric,
  temperature_c numeric,
  sources text[] not null default '{}',
  confidence numeric not null default 0 check (confidence between 0 and 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, run_id)
);

create table if not exists public.biometric_samples (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null,
  sampled_at timestamptz not null,
  value numeric not null,
  unit text not null,
  source text not null,
  source_sample_id text,
  device text,
  confidence numeric not null default 1 check (confidence between 0 and 1),
  unique nulls not distinct (user_id, source, source_sample_id)
);

create table if not exists public.biometric_streams (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  stream_type text not null,
  source text not null,
  sample_period_seconds numeric,
  samples jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, run_id, stream_type, source)
);

create table if not exists public.runner_baselines (
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_type text not null,
  window_days integer not null check (window_days in (7, 28, 90)),
  mean_value numeric not null,
  lower_bound numeric not null,
  upper_bound numeric not null,
  variance numeric not null default 0,
  sample_count integer not null default 0,
  confidence numeric not null default 0 check (confidence between 0 and 1),
  calculated_at timestamptz not null default now(),
  primary key (user_id, metric_type, window_days)
);

create table if not exists public.body_state_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  recovery_score smallint check (recovery_score between 0 and 100),
  sleep_score smallint check (sleep_score between 0 and 100),
  cardiovascular_load smallint not null check (cardiovascular_load between 0 and 100),
  musculoskeletal_load smallint not null check (musculoskeletal_load between 0 and 100),
  easy_readiness smallint not null check (easy_readiness between 0 and 100),
  long_readiness smallint not null check (long_readiness between 0 and 100),
  speed_readiness smallint not null check (speed_readiness between 0 and 100),
  hill_readiness smallint not null check (hill_readiness between 0 and 100),
  estimated_leg_load jsonb not null default '{}',
  signal_evidence jsonb not null default '[]',
  confidence numeric not null default 0 check (confidence between 0 and 1),
  engine_version text not null,
  calculated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table if not exists public.runner_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id text,
  reported_at timestamptz not null default now(),
  fatigue smallint check (fatigue between 0 and 10),
  soreness smallint check (soreness between 0 and 10),
  pain_location text,
  pain_severity smallint check (pain_severity between 0 and 10),
  perceived_effort smallint check (perceived_effort between 1 and 10),
  shoe_comfort smallint check (shoe_comfort between 1 and 5),
  notes text
);

create table if not exists public.detected_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pattern_type text not null,
  statement text not null,
  evidence jsonb not null default '[]',
  strength numeric not null check (strength between 0 and 1),
  sample_count integer not null,
  first_observed_at timestamptz not null,
  last_observed_at timestamptz not null,
  engine_version text not null,
  unique (user_id, pattern_type, statement)
);

create index if not exists biometric_samples_user_metric_time
  on public.biometric_samples(user_id, metric_type, sampled_at desc);
create index if not exists biometric_streams_user_run
  on public.biometric_streams(user_id, run_id);
create index if not exists runner_feedback_user_time
  on public.runner_feedback(user_id, reported_at desc);

alter table public.data_connections enable row level security;
alter table public.daily_biometrics enable row level security;
alter table public.activity_biometrics enable row level security;
alter table public.biometric_samples enable row level security;
alter table public.biometric_streams enable row level security;
alter table public.runner_baselines enable row level security;
alter table public.body_state_daily enable row level security;
alter table public.runner_feedback enable row level security;
alter table public.detected_patterns enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'data_connections', 'daily_biometrics', 'activity_biometrics',
    'biometric_samples', 'biometric_streams', 'runner_baselines',
    'body_state_daily', 'runner_feedback', 'detected_patterns'
  ]
  loop
    execute format('drop policy if exists "body_select_own" on public.%I', table_name);
    execute format(
      'create policy "body_select_own" on public.%I for select using (auth.uid() = user_id)',
      table_name
    );
    execute format('drop policy if exists "body_insert_own" on public.%I', table_name);
    execute format(
      'create policy "body_insert_own" on public.%I for insert with check (auth.uid() = user_id)',
      table_name
    );
    execute format('drop policy if exists "body_update_own" on public.%I', table_name);
    execute format(
      'create policy "body_update_own" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name
    );
    execute format('drop policy if exists "body_delete_own" on public.%I', table_name);
    execute format(
      'create policy "body_delete_own" on public.%I for delete using (auth.uid() = user_id)',
      table_name
    );
  end loop;
end $$;
