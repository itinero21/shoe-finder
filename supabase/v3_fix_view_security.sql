-- Fix: Remove SECURITY DEFINER from shoe_choices_aggregate view
-- This makes it use the querying user's permissions (safer)

drop view if exists public.shoe_choices_aggregate;

create view public.shoe_choices_aggregate
with (security_invoker = true)
as
  select shoe_id, count(distinct user_id)::integer as user_count
  from public.shoe_choices
  group by shoe_id
  order by user_count desc;

grant select on public.shoe_choices_aggregate to authenticated;
