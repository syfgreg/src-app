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
delete from public.glory_pics   where created_at < '2026-11-01';
delete from public.notifications; -- always ephemeral, no cutoff needed
-- The 1998-2025 archive is protected by year (its rows carry period-accurate
-- created_at values, so a date cutoff alone can't tell it apart from test
-- data) — test-era tournament rows are wiped if created before the cutoff,
-- published or not.
delete from public.tournaments where year >= 2026 and created_at < '2026-11-01';

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
--   public.records                                 — the record book is a
--     permanent, standing baseline, visible year over year. It only changes
--     the way it's meant to: an official tournament participant breaking it
--     for real (via the app's own record-breaker flow), never via a reset.
--   public.profiles, public.invites, auth.users  — real registered anglers keep
--     their accounts; nobody has to re-register.
--   public.newsletters                            — includes the protected
--     historical archive; never wiped by this script.
--   public.push_subscriptions                     — device registrations stay
--     valid; no need to re-subscribe to push.
--   settings.species / settings.roster_overrides   — scoring config + historic
--     roster overrides are not "test data", left as configured.
-- ============================================================================
