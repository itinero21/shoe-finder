do $$
declare
  statements text[] := array[
    'create policy "sc_sel" on public.shoe_choices for select using (true)',
    'create policy "sc_ins" on public.shoe_choices for insert with check (auth.uid() = shoe_choices.user_id)',
    'create policy "rp_sel" on public.run_paths for select using (auth.uid() = run_paths.user_id)',
    'create policy "rp_ins" on public.run_paths for insert with check (auth.uid() = run_paths.user_id)',
    'create policy "rp_upd" on public.run_paths for update using (auth.uid() = run_paths.user_id)',
    'create policy "tc_sel" on public.territory_cities for select using (true)',
    'create policy "tc_ins" on public.territory_cities for insert with check (auth.uid() is not null)',
    'create policy "tc_upd" on public.territory_cities for update using (auth.uid() is not null)',
    'create policy "ob_upd" on public.obituaries for update using (auth.uid() = obituaries.user_id)'
  ];
  stmt text;
begin
  foreach stmt in array statements loop
    begin
      execute stmt;
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

alter table public.shoe_choices force row level security;
alter table public.run_paths force row level security;
alter table public.territory_cities force row level security;
