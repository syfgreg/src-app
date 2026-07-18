-- ============================================================================
-- RESET GLORY SHOTS — clears the working Glory Shots board (year-round
-- submissions + past ballots) for a fresh season. Run this whenever you're
-- ready — there's no cutoff date, because it's always safe: any photo that
-- made a ballot and had its voting closed was already permanently archived
-- to public.glory_fav_history (see archiveGloryFavBallot in
-- src/data/repository.ts) and is skipped here, so nothing historical is lost.
--
-- HOW TO RUN:
--   supabase db query --linked --file supabase/reset-glory-shots.sql
--   (or paste into Supabase dashboard -> SQL Editor -> Run)
--
-- This is DESTRUCTIVE for public.glory_pics. Nothing else is touched —
-- run supabase/reset-test-data.sql separately for tournament data.
-- ============================================================================

delete from public.glory_pics
where id not in (
  select source_id from public.glory_fav_history where source_id is not null
);
