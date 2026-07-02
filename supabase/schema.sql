-- ============================================================================
-- Sea Robin Classic — Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- Safe to re-run (idempotent-ish): drops policies before recreating.
-- ============================================================================

-- ---------- helper: is the caller the M.O.C.? --------------------------------
create or replace function public.is_moc()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role_tag = 'MOC'
  );
$$;

-- ---------- profiles (1:1 with auth.users) -----------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  name       text not null,
  nickname   text,
  role_tag   text not null default 'JAFNG'
             check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG')),
  created_at timestamptz not null default now()
);

-- create a profile automatically whenever an auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role_tag)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'JAFNG'
  )
  on conflict (id) do nothing;
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
  off_season_mode      boolean not null default false
);

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

-- ---------- glory pics (off-season feed) -------------------------------------
create table if not exists public.glory_pics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  photo_url   text not null,
  description text,
  catch_date  timestamptz,
  comments    jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- ---------- notifications (shared broadcast feed) ----------------------------
-- read/unread state is tracked per-device on the client, not here.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  message    text not null,
  created_at timestamptz not null default now()
);

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
alter table public.notifications enable row level security;

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

-- notifications: everyone reads; any authed may broadcast (catch submit/approve)
drop policy if exists notif_read   on public.notifications;
drop policy if exists notif_insert on public.notifications;
create policy notif_read   on public.notifications for select to authenticated using (true);
create policy notif_insert on public.notifications for insert to authenticated with check (true);

-- ============================================================================
-- Realtime: broadcast row changes so every device's board updates live
-- ============================================================================
alter publication supabase_realtime add table public.catches;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.records;
alter publication supabase_realtime add table public.glory_pics;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.settings;

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

insert into public.records (species, holder, year, length_inches) values
  ('Sea Robin', 'N/A — the Coveted remains uncaught', null, 0),
  ('Skate', 'Greg Keresty', 2012, 29),
  ('Shark', 'Dave Gonzalez', 2006, 39),
  ('Eel', 'Sean Sullivan', 2007, 26),
  ('Stargazer', 'Pete Dzien', 2013, 21.5),
  ('Striped Bass', 'Peter Dzien', 2008, 26),
  ('Red Drum', 'Dave Gonzalez', 2013, 25.5),
  ('Black Drum', 'Sean Sullivan', 2018, 11),
  ('Sheepshead', 'Mike Cooper', 2007, 11),
  ('Bluefish', 'Eric Keresty', 2004, 17.5),
  ('Flounder', 'George Mummert', 2009, 19.25),
  ('Sea Trout', 'Mike Cooper', 2003, 16),
  ('Spot', 'Will Koth', 2012, 6),
  ('Croaker', 'N/A — open record', null, 0),
  ('Kingfish', 'Steve Getsie', 2015, 13),
  ('Spotted Hake', 'Mike Cooper', 2008, 12),
  ('Puffer Fish', 'Charles Goins', 2016, 7)
on conflict (species) do nothing;

-- ============================================================================
-- AFTER you sign up in the app, promote yourself to M.O.C.:
--   update public.profiles set role_tag = 'MOC' where email = 'you@example.com';
-- ============================================================================
