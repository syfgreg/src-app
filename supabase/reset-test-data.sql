-- ============================================================================
-- RESET TEST DATA — wipes everything created before the real season starts.
-- Everything from now until MOCK_CUTOFF (Nov 1, 2026) — including any mock
-- tournament, published or not — is considered test data. Update the date
-- below if the real season's start date ever changes.
--
-- HOW TO RUN:
--   supabase db query --linked --file supabase/reset-test-data.sql
--   (or paste into Supabase dashboard -> SQL Editor -> Run)
--
-- This is DESTRUCTIVE for the tables it touches. Review the "WIPED" list
-- below before running. Nothing here touches auth/login in any way.
-- ============================================================================

-- ---------- WIPED: everything created before the real season ----------------
-- MOCK_CUTOFF: anything created before this date is mock/test data, full
-- stop — regardless of tournament year or whether it was ever published.
delete from public.catches      where created_at < '2026-11-01';
delete from public.penalties    where created_at < '2026-11-01';
delete from public.notifications; -- always ephemeral, no cutoff needed
-- The 1998-2025 archive is protected by year (its rows carry period-accurate
-- created_at values, so a date cutoff alone can't tell it apart from test
-- data) — test-era tournament rows are wiped if created before the cutoff,
-- published or not.
delete from public.tournaments where year >= 2026 and created_at < '2026-11-01';

-- ---------- RESTORED: record book back to its real, permanent baseline ------
-- Until MOCK_CUTOFF, any record-breaker set through the app is necessarily
-- test/mock play (the real November tournament hasn't happened yet) — so
-- every species is force-set back to the official baseline (2026 Rules &
-- Regulations, Section 5-H) on every run. After the cutoff, stop running this
-- script — real record-breaks from here on must never be touched by it again.
update public.records set holder = 'N/A — the Coveted remains uncaught', year = null, length_inches = 0 where species = 'Sea Robin';
update public.records set holder = 'Peter Dzien', year = 2008, length_inches = 26 where species = 'Striped Bass';
update public.records set holder = 'Jeff Kern', year = 2020, length_inches = 20 where species = 'Flounder';
update public.records set holder = 'Dave Gonzalez', year = 2013, length_inches = 25.5 where species = 'Red Drum';
update public.records set holder = 'Sean Sullivan', year = 2018, length_inches = 11 where species = 'Black Drum';
update public.records set holder = 'Mike Cooper', year = 2007, length_inches = 11 where species = 'Sheepshead';
update public.records set holder = 'Eric Keresty', year = 2004, length_inches = 17.5 where species = 'Bluefish';
update public.records set holder = 'Mike Cooper', year = 2003, length_inches = 16 where species = 'Sea Trout';
update public.records set holder = 'Jerry Egan', year = 2022, length_inches = 14.25 where species = 'Kingfish';
update public.records set holder = 'Will Koth', year = 2020, length_inches = 7 where species = 'Croaker';
update public.records set holder = 'Dave Gonzalez', year = 2024, length_inches = 10 where species = 'Spot';
update public.records set holder = 'Mike Cooper', year = 2008, length_inches = 12 where species = 'Spotted Hake';
update public.records set holder = 'Phill Hall', year = 2020, length_inches = 8 where species = 'Silver Perch';
update public.records set holder = 'Fred Bubeck', year = 2019, length_inches = 10 where species = 'Puffer Fish';
update public.records set holder = 'Sean Sullivan', year = 2007, length_inches = 26 where species = 'Eel';
update public.records set holder = 'Dave Gonzalez', year = 2022, length_inches = 8.5 where species = 'Cusk Eel';
update public.records set holder = 'Greg Keresty', year = 2012, length_inches = 29 where species = 'Skate';
update public.records set holder = 'Dave Gonzalez', year = 2006, length_inches = 39 where species = 'Shark';
update public.records set holder = 'Greg Hudson (Butterfly)', year = 2023, length_inches = 19.5 where species = 'Ray';
update public.records set holder = 'Pete Dzien', year = 2013, length_inches = 21.5 where species = 'Stargazer';

-- ---------- RESET: settings back to a clean, unstarted tournament cycle -----
update public.settings set
  tournament_year   = extract(year from now())::int,
  tournament_state  = 'SETUP',
  glory_fav_state   = 'OFF',
  reviewed_anglers  = '[]'::jsonb,
  glory_fav_locked_voters = '[]'::jsonb,
  published_at      = null
where id = 1;

-- ---------- NOT TOUCHED (intentionally) --------------------------------------
--   public.glory_pics                              — Glory Shot submissions
--     are real starting now (Jul 21, 2026): every shot posted from here on is
--     an actual entry toward the November tournament's Glory Shot Fav, not
--     test data. Never wiped by this script again.
--   public.profiles, public.invites, auth.users  — real registered anglers keep
--     their accounts; nobody has to re-register.
--   public.newsletters                            — includes the protected
--     historical archive; never wiped by this script.
--   public.push_subscriptions                     — device registrations stay
--     valid; no need to re-subscribe to push.
--   settings.species / settings.roster_overrides   — scoring config + historic
--     roster overrides are not "test data", left as configured.
-- ============================================================================
