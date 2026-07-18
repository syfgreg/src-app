-- ============================================================================
-- Sea Robin Classic — Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- Safe to re-run (idempotent-ish): drops policies before recreating.
-- ============================================================================

-- ---------- helper: is the caller the M.O.C.? --------------------------------
-- plpgsql (not sql) so the profiles reference resolves at call time, letting
-- this helper be defined before the profiles table.
create or replace function public.is_moc()
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role_tag = 'MOC'
  );
end;
$$;

-- ---------- profiles (1:1 with auth.users) -----------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  name       text not null,
  nickname   text,
  role_tag   text not null default 'JAFNG'
             check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG','INACTIVE')),
  created_at timestamptz not null default now()
);

-- ---------- invites (pending roster pre-registrations) -----------------------
-- Created here (before handle_new_user) because the trigger function reads it.
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  role_tag   text not null default 'ANGLER'
             check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG','INACTIVE')),
  created_at timestamptz not null default now()
);
create index if not exists invites_email_idx on public.invites (lower(email));

-- ---------- tournaments (named registry / history) ---------------------------
-- The active tournament is the row whose year = settings.tournament_year.
create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  year            int not null,
  participant_ids jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  published_at    timestamptz,
  scheduled_for   timestamptz
);
create index if not exists tournaments_year_idx on public.tournaments (year);
alter table public.tournaments add column if not exists scheduled_for timestamptz;

-- create a profile automatically whenever an auth user signs up.
-- If the M.O.C. left a pending invite for this email, inherit its role (and
-- name) instead of the default JAFNG, then consume the invite.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited record;
begin
  select * into invited from public.invites
    where lower(email) = lower(new.email)
    order by created_at desc
    limit 1;

  insert into public.profiles (id, email, name, role_tag)
  values (
    new.id,
    new.email,
    coalesce(invited.name, new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(invited.role_tag, 'JAFNG')
  )
  on conflict (id) do nothing;

  if invited.id is not null then
    delete from public.invites where lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- settings (single tournament-config row) --------------------------
create table if not exists public.settings (
  id                   int primary key default 1 check (id = 1),
  tournament_year      int not null,
  lure_bonus_ppi       numeric not null default 100,
  trophy_min_inches    numeric not null default 24,
  trophy_bonus         numeric not null default 500,
  record_breaker_bonus numeric not null default 1000,
  skate_baseline_ppi   numeric not null default 10,
  species              jsonb not null,
  off_season_mode      boolean not null default false,
  tournament_state     text not null default 'SETUP'
                       check (tournament_state in ('SETUP','LIVE','ENDED','PUBLISHED')),
  published_at         timestamptz,
  reviewed_anglers     jsonb not null default '[]'::jsonb,
  glory_fav_state      text not null default 'OFF'
                       check (glory_fav_state in ('OFF','OPEN','CLOSED','PUBLISHED')),
  roster_overrides     jsonb not null default '{}'::jsonb,
  glory_fav_locked_voters jsonb not null default '[]'::jsonb
);
-- Migration for an existing settings row (idempotent):
alter table public.settings
  add column if not exists tournament_state text not null default 'SETUP'
    check (tournament_state in ('SETUP','LIVE','ENDED','PUBLISHED')),
  add column if not exists published_at timestamptz,
  add column if not exists reviewed_anglers jsonb not null default '[]'::jsonb,
  add column if not exists glory_fav_locked_voters jsonb not null default '[]'::jsonb;

-- ---------- newsletters (M.O.C. bulletin feed) -------------------------------
create table if not exists public.newsletters (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  author     text not null,
  created_at timestamptz not null default now(),
  -- Undeletable posts (e.g. the historical archive import) — enforced via RLS below.
  protected  boolean not null default false
);
create index if not exists newsletters_created_at_idx on public.newsletters (created_at desc);

-- ---------- records ----------------------------------------------------------
create table if not exists public.records (
  species       text primary key,
  holder        text not null,
  year          int,
  length_inches numeric not null
);

-- ---------- catches ----------------------------------------------------------
create table if not exists public.catches (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  tournament_year   int not null,
  species           text not null,
  species_detected  text,
  length_inches     numeric not null,
  gear_type         text not null check (gear_type in ('BAIT','LURE')),
  is_skate          boolean not null default false,
  is_trophy         boolean not null default false,
  is_record_breaker boolean not null default false,
  point_value       numeric not null,
  photo_url         text,
  lat               numeric,
  lng               numeric,
  ai_confidence     numeric,
  ai_notes          text,
  status            text not null default 'PENDING'
                    check (status in ('PENDING','APPROVED','REJECTED')),
  verified_by       text,
  created_at        timestamptz not null default now()
);
create index if not exists catches_year_idx on public.catches (tournament_year);
create index if not exists catches_user_idx on public.catches (user_id);

-- ---------- penalties (M.O.C. scoring deficits) ------------------------------
create table if not exists public.penalties (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tournament_year int not null,
  description     text not null default '',
  points          numeric not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists penalties_user_idx on public.penalties (user_id);
create index if not exists penalties_year_idx on public.penalties (tournament_year);

-- ---------- glory pics (off-season feed) -------------------------------------
create table if not exists public.glory_pics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  photo_url   text not null,
  description text,
  catch_date  timestamptz,
  comments    jsonb not null default '[]',
  nominated_year int,                          -- set = on that year's Glory Shot Fav ballot
  votes       jsonb not null default '[]',     -- profile ids that voted this shot the fav
  created_at  timestamptz not null default now()
);

-- ---------- glory fav history (permanent ballot archive) ---------------------
-- Written once per year, the moment that year's Glory Shot Fav voting closes
-- (see archiveGloryFavBallot in src/data/repository.ts). Every nominee that
-- made the ballot is preserved here forever — photo, submitter, final vote
-- count, and whether it won — independent of whatever later happens to the
-- working public.glory_pics board. Never wiped by any reset script.
create table if not exists public.glory_fav_history (
  id          uuid primary key default gen_random_uuid(),
  year        int not null,
  source_id   uuid,                             -- the original glory_pics.id (not FK'd — that row may later be deleted)
  photo_url   text not null,
  submitter   text not null,
  description text,
  votes       int not null default 0,
  is_winner   boolean not null default false,
  archived_at timestamptz not null default now()
);
create index if not exists glory_fav_history_year_idx on public.glory_fav_history (year);

-- ---------- notifications (shared broadcast feed) ----------------------------
-- read/unread state is tracked per-device on the client, not here.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  created_at timestamptz not null default now()
);

-- ---------- push subscriptions (Web Push device registrations) ---------------
-- One row per installed device. Read only by the send-push function (service
-- role, bypasses RLS) — never joined against by the client.
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- ============================================================================
-- Row Level Security
-- Trusted 24-angler roster: everyone signed in can read the shared board;
-- writes are constrained to your own rows, with the M.O.C. as override.
-- ============================================================================
alter table public.profiles      enable row level security;
alter table public.settings      enable row level security;
alter table public.records       enable row level security;
alter table public.catches       enable row level security;
alter table public.glory_pics    enable row level security;
alter table public.glory_fav_history enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletters   enable row level security;
alter table public.tournaments   enable row level security;
alter table public.invites       enable row level security;
alter table public.penalties     enable row level security;
alter table public.push_subscriptions enable row level security;

-- profiles: everyone authed reads (leaderboard needs names); edit self; M.O.C. edits anyone
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_moc())
  with check (id = auth.uid() or public.is_moc());

-- settings: everyone reads; only M.O.C. writes
drop policy if exists settings_read   on public.settings;
drop policy if exists settings_write  on public.settings;
create policy settings_read  on public.settings for select to authenticated using (true);
create policy settings_write on public.settings for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- records: everyone reads; only M.O.C. writes (approving a record breaker)
drop policy if exists records_read  on public.records;
drop policy if exists records_write on public.records;
create policy records_read  on public.records for select to authenticated using (true);
create policy records_write on public.records for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- catches: everyone reads; insert your own; update your own OR M.O.C.; M.O.C. deletes
drop policy if exists catches_read   on public.catches;
drop policy if exists catches_insert on public.catches;
drop policy if exists catches_update on public.catches;
drop policy if exists catches_delete on public.catches;
create policy catches_read   on public.catches for select to authenticated using (true);
create policy catches_insert on public.catches for insert to authenticated
  with check (user_id = auth.uid());
create policy catches_update on public.catches for update to authenticated
  using (user_id = auth.uid() or public.is_moc())
  with check (user_id = auth.uid() or public.is_moc());
create policy catches_delete on public.catches for delete to authenticated
  using (public.is_moc());

-- glory pics: everyone reads; insert your own; any authed may update (comments)
drop policy if exists glory_read   on public.glory_pics;
drop policy if exists glory_insert on public.glory_pics;
drop policy if exists glory_update on public.glory_pics;
create policy glory_read   on public.glory_pics for select to authenticated using (true);
create policy glory_insert on public.glory_pics for insert to authenticated
  with check (user_id = auth.uid());
create policy glory_update on public.glory_pics for update to authenticated
  using (true) with check (true);

-- glory fav history: everyone reads the permanent archive; only M.O.C. writes it
drop policy if exists glory_history_read  on public.glory_fav_history;
drop policy if exists glory_history_write on public.glory_fav_history;
create policy glory_history_read  on public.glory_fav_history for select to authenticated using (true);
create policy glory_history_write on public.glory_fav_history for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- notifications: everyone reads; any authed may broadcast (catch submit/approve)
drop policy if exists notif_read   on public.notifications;
drop policy if exists notif_insert on public.notifications;
create policy notif_read   on public.notifications for select to authenticated using (true);
create policy notif_insert on public.notifications for insert to authenticated with check (true);

-- newsletters: everyone reads; only M.O.C. writes; protected posts can't be deleted
drop policy if exists newsletters_read   on public.newsletters;
drop policy if exists newsletters_write  on public.newsletters;
drop policy if exists newsletters_insert on public.newsletters;
drop policy if exists newsletters_update on public.newsletters;
drop policy if exists newsletters_delete on public.newsletters;
create policy newsletters_read   on public.newsletters for select to authenticated using (true);
create policy newsletters_insert on public.newsletters for insert to authenticated
  with check (public.is_moc());
create policy newsletters_update on public.newsletters for update to authenticated
  using (public.is_moc()) with check (public.is_moc());
create policy newsletters_delete on public.newsletters for delete to authenticated
  using (public.is_moc() and not protected);

-- tournaments: everyone reads (history/participants); only M.O.C. writes
drop policy if exists tournaments_read  on public.tournaments;
drop policy if exists tournaments_write on public.tournaments;
create policy tournaments_read  on public.tournaments for select to authenticated using (true);
create policy tournaments_write on public.tournaments for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- invites: only the M.O.C. reads or writes (the trigger consumes them via SECURITY DEFINER)
drop policy if exists invites_read  on public.invites;
drop policy if exists invites_write on public.invites;
create policy invites_read  on public.invites for select to authenticated using (public.is_moc());
create policy invites_write on public.invites for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- penalties: everyone reads (angler sees own deficit); only the M.O.C. writes
drop policy if exists penalties_read  on public.penalties;
drop policy if exists penalties_write on public.penalties;
create policy penalties_read  on public.penalties for select to authenticated using (true);
create policy penalties_write on public.penalties for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- push subscriptions: each device manages only its own registration
drop policy if exists push_subs_read   on public.push_subscriptions;
drop policy if exists push_subs_insert on public.push_subscriptions;
drop policy if exists push_subs_update on public.push_subscriptions;
drop policy if exists push_subs_delete on public.push_subscriptions;
create policy push_subs_read   on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_subs_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_subs_update on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_subs_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- ============================================================================
-- Realtime: broadcast row changes so every device's board updates live
-- ============================================================================
alter publication supabase_realtime add table public.catches;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.records;
alter publication supabase_realtime add table public.glory_pics;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.settings;
alter publication supabase_realtime add table public.newsletters;
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.invites;
alter publication supabase_realtime add table public.penalties;

-- ============================================================================
-- Storage buckets (public read, authenticated write)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('catch-photos', 'catch-photos', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('glory-pics', 'glory-pics', true)
on conflict (id) do nothing;

drop policy if exists "public read catch photos"   on storage.objects;
drop policy if exists "authed write catch photos"   on storage.objects;
drop policy if exists "public read glory pics"      on storage.objects;
drop policy if exists "authed write glory pics"     on storage.objects;
create policy "public read catch photos" on storage.objects for select
  using (bucket_id = 'catch-photos');
create policy "authed write catch photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'catch-photos');
create policy "public read glory pics" on storage.objects for select
  using (bucket_id = 'glory-pics');
create policy "authed write glory pics" on storage.objects for insert to authenticated
  with check (bucket_id = 'glory-pics');

-- "backups" bucket is created lazily (server-side, service role) by the backup
-- function on first run — no insert policy needed here since only that
-- service-role client writes to it. M.O.C. reads it directly to download files.
drop policy if exists "moc read backups" on storage.objects;
create policy "moc read backups" on storage.objects for select to authenticated
  using (bucket_id = 'backups' and public.is_moc());

-- "newsletter-pdfs": public read (same convention as catch-photos/glory-pics),
-- M.O.C.-only upload (matches newsletters_write).
insert into storage.buckets (id, name, public)
values ('newsletter-pdfs', 'newsletter-pdfs', true)
on conflict (id) do nothing;
drop policy if exists "public read newsletter pdfs" on storage.objects;
drop policy if exists "moc write newsletter pdfs" on storage.objects;
create policy "public read newsletter pdfs" on storage.objects for select
  using (bucket_id = 'newsletter-pdfs');
create policy "moc write newsletter pdfs" on storage.objects for insert to authenticated
  with check (bucket_id = 'newsletter-pdfs' and public.is_moc());

-- ============================================================================
-- Seed: settings + official records (2019 rulebook, Section 5-H)
-- ============================================================================
insert into public.settings (id, tournament_year, species)
values (
  1,
  extract(year from now())::int,
  '[
    {"name":"Sea Robin","tier":"SEA_ROBIN","pointsPerInch":150},
    {"name":"Striped Bass","tier":"GAME_1","pointsPerInch":100},
    {"name":"Red Drum","tier":"GAME_1","pointsPerInch":100},
    {"name":"Black Drum","tier":"GAME_1","pointsPerInch":100},
    {"name":"Sheepshead","tier":"GAME_1","pointsPerInch":100},
    {"name":"Flounder","tier":"GAME_2","pointsPerInch":60},
    {"name":"Sea Trout","tier":"GAME_2","pointsPerInch":60},
    {"name":"Bluefish","tier":"GAME_2","pointsPerInch":60},
    {"name":"Kingfish","tier":"GAME_2","pointsPerInch":60},
    {"name":"Croaker","tier":"GAME_2","pointsPerInch":60},
    {"name":"Skate","tier":"TRASH","pointsPerInch":10,"skate":true},
    {"name":"Shark","tier":"TRASH","pointsPerInch":10},
    {"name":"Eel","tier":"TRASH","pointsPerInch":10},
    {"name":"Stargazer","tier":"TRASH","pointsPerInch":10},
    {"name":"Spot","tier":"TRASH","pointsPerInch":10},
    {"name":"Spotted Hake","tier":"TRASH","pointsPerInch":10},
    {"name":"Puffer Fish","tier":"TRASH","pointsPerInch":10}
  ]'::jsonb
)
on conflict (id) do nothing;

-- Source: 2026 Official Rules, Section 5-H (matches src/domain/records.ts /
-- migration-2026-records.sql — the older 2019-rulebook values this replaced
-- are stale; keep these three in sync if the rulebook changes again).
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
  ('Stargazer',    'Pete Dzien',    2013, 21.5)
on conflict (species) do nothing;

-- ============================================================================
-- AFTER you sign up in the app, promote yourself to M.O.C.:
--   update public.profiles set role_tag = 'MOC' where email = 'you@example.com';
-- ============================================================================
