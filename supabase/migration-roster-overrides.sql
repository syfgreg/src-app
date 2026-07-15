-- Roster status overrides for non-login members (historic anglers from the
-- career data): a name→role map on the single settings row. Real login anglers
-- keep their role on their own profile.
alter table public.settings add column if not exists roster_overrides jsonb not null default '{}'::jsonb;
