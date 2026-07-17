-- Glory Shot Fav: let each participant lock in their vote before the M.O.C.
-- closes voting. Idempotent — safe to run again.
alter table public.settings
  add column if not exists glory_fav_locked_voters jsonb not null default '[]'::jsonb;
