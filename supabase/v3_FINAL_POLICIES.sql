-- Run this AFTER v3_FINAL.sql succeeds.
-- Policies are separate because Supabase editor chokes when mixed with CREATE TABLE.

create policy "sc_sel" on public.shoe_choices for select using (true);
create policy "sc_ins" on public.shoe_choices for insert with check (auth.uid() = shoe_choices.user_id);
create policy "rp_sel" on public.run_paths for select using (auth.uid() = run_paths.user_id);
create policy "rp_ins" on public.run_paths for insert with check (auth.uid() = run_paths.user_id);
create policy "rp_upd" on public.run_paths for update using (auth.uid() = run_paths.user_id);
create policy "tc_sel" on public.territory_cities for select using (true);
create policy "tc_ins" on public.territory_cities for insert with check (auth.uid() is not null);
create policy "tc_upd" on public.territory_cities for update using (auth.uid() is not null);
