-- STEP 3a: Enable RLS on new tables
-- Run this AFTER step 2.

alter table public.shoe_choices enable row level security;
alter table public.run_paths enable row level security;
alter table public.territory_cities enable row level security;
