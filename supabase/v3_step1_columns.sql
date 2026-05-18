-- STEP 1: Add missing columns to existing tables

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
exception when others then null; end $$;

create index if not exists runs_external_id on public.runs(external_id) where external_id is not null;
create index if not exists runs_coordinates on public.runs(user_id) where coordinates is not null;
create index if not exists obituaries_user_id on public.obituaries(user_id);
