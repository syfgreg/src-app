-- Glory Shot Fav: the M.O.C. curates a ballot of glory shots per tournament and
-- participants vote for their favorite. Additive columns on glory_pics.
--   nominated_year — set = this shot is on that tournament year's ballot.
--   votes          — jsonb array of profile ids (one vote per participant).
-- The existing glory_update RLS policy (any authenticated user may update) already
-- lets participants cast votes and the M.O.C. manage the ballot; no policy change.

alter table public.glory_pics add column if not exists nominated_year int;
alter table public.glory_pics add column if not exists votes jsonb not null default '[]';

-- Glory Shot Fav vote lifecycle, driven manually by the M.O.C. and separate from
-- the tournament state: OFF → OPEN (on tournament end) → CLOSED → PUBLISHED.
alter table public.settings add column if not exists glory_fav_state text not null default 'OFF'
  check (glory_fav_state in ('OFF','OPEN','CLOSED','PUBLISHED'));
