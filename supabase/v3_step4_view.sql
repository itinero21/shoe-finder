-- STEP 4: Aggregate view for leaderboard

drop view if exists public.shoe_choices_aggregate cascade;
drop materialized view if exists public.shoe_choices_aggregate cascade;

create view public.shoe_choices_aggregate as
  select shoe_id, count(distinct user_id)::integer as user_count
  from public.shoe_choices
  group by shoe_id
  order by user_count desc;

grant select on public.shoe_choices_aggregate to authenticated;
