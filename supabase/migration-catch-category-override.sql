-- Lets the M.O.C. reclassify a catch's scoring tier at ruling time (e.g. a
-- species defaulted to Game Fish Tier 2 that should actually score as Trash
-- Fish). Idempotent.
alter table public.catches add column if not exists category_override text
  check (category_override in ('SEA_ROBIN','GAME_1','GAME_2','TRASH'));
