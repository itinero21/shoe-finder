-- STEP 3b: Policies
-- Run EACH statement one at a time if the whole file fails.

create policy "shoe_choices_select" on public.shoe_choices for select using (true);

create policy "shoe_choices_insert" on public.shoe_choices for insert with check (auth.uid() = user_id);

create policy "run_paths_select" on public.run_paths for select using (auth.uid() = user_id);

create policy "run_paths_insert" on public.run_paths for insert with check (auth.uid() = user_id);

create policy "run_paths_update" on public.run_paths for update using (auth.uid() = user_id);

create policy "cities_select" on public.territory_cities for select using (true);

create policy "cities_insert" on public.territory_cities for insert with check (auth.uid() is not null);

create policy "cities_update" on public.territory_cities for update using (auth.uid() is not null);

create policy "obituaries_update" on public.obituaries for update using (auth.uid() = user_id);
