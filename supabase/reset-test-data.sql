-- ============================================================================
-- RESET TEST DATA — run this once testing wraps up, to start the real
-- tournament season with a clean board.
--
-- HOW TO RUN:
--   supabase db query --linked --file supabase/reset-test-data.sql
--   (or paste into Supabase dashboard -> SQL Editor -> Run)
--
-- This is DESTRUCTIVE for the tables it touches. Review the "WIPED" list
-- below before running. Nothing here touches auth/login in any way.
-- ============================================================================

-- ---------- WIPED: all test tournament activity -----------------------------
delete from public.catches;
delete from public.penalties;
delete from public.glory_pics;
delete from public.notifications;
delete from public.tournaments;

-- ---------- RESET: records back to the official 2026 rulebook baseline ------
-- (undoes any record broken by a test catch). Source: src/domain/records.ts /
-- migration-2026-records.sql, Section 5-H — NOT the older schema.sql seed,
-- which was never updated to match and is stale.
delete from public.records;
insert into public.records (species, holder, year, length_inches) values
  ('Sea Robin',    'N/A — the Coveted remains uncaught', null, 0),
  ('Striped Bass', 'Peter Dzien',   2008, 26),
  ('Flounder',     'Jeff Kern',     2020, 20),
  ('Red Drum',     'Dave Gonzalez', 2013, 25.5),
  ('Black Drum',   'Sean Sullivan', 2018, 11),
  ('Sheepshead',   'Mike Cooper',   2007, 11),
  ('Bluefish',     'Eric Keresty',  2004, 17.5),
  ('Sea Trout',    'Mike Cooper',   2003, 16),
  ('Kingfish',     'Jerry Egan',    2022, 14.25),
  ('Croaker',      'Will Koth',     2020, 7),
  ('Spot',         'Dave Gonzalez', 2024, 10),
  ('Spotted Hake', 'Mike Cooper',   2008, 12),
  ('Silver Perch', 'Phill Hall',    2020, 8),
  ('Puffer Fish',  'Fred Bubeck',   2019, 10),
  ('Eel',          'Sean Sullivan', 2007, 26),
  ('Cusk Eel',     'Dave Gonzalez', 2022, 8.5),
  ('Skate',        'Greg Keresty',  2012, 29),
  ('Shark',        'Dave Gonzalez', 2006, 39),
  ('Ray',          'Greg Hudson (Butterfly)', 2023, 19.5),
  ('Stargazer',    'Pete Dzien',    2013, 21.5);

-- ---------- RESET: settings back to a clean, unstarted tournament cycle -----
update public.settings set
  tournament_year   = extract(year from now())::int,
  tournament_state  = 'SETUP',
  glory_fav_state   = 'OFF',
  reviewed_anglers  = '[]'::jsonb,
  published_at      = null
where id = 1;

-- ---------- NOT TOUCHED (intentionally) --------------------------------------
--   public.profiles, public.invites, auth.users  — real registered anglers keep
--     their accounts; nobody has to re-register.
--   public.newsletters                            — includes the protected
--     historical archive; never wiped by this script.
--   public.push_subscriptions                     — device registrations stay
--     valid; no need to re-subscribe to push.
--   settings.species / settings.roster_overrides   — scoring config + historic
--     roster overrides are not "test data", left as configured.
-- ============================================================================
