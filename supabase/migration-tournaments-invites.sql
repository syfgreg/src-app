-- ============================================================================
-- Sea Robin Classic — migration: tournament history + roster invites
-- Additive only (no changes to existing tables). Run once in the Supabase SQL
-- editor. Safe to re-run EXCEPT the two `alter publication ... add table`
-- lines at the bottom, which error if the table is already published — ignore
-- that specific "already member of publication" error if you re-run.
-- ============================================================================

-- ---------- invites (pending roster pre-registrations) -----------------------
create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  name       text,
  role_tag   text not null default 'ANGLER'
             check (role_tag in ('MOC','GRAND_ROBIN','CHAMP','ANGLER','JAFNG')),
  created_at timestamptz not null default now()
);
create index if not exists invites_email_idx on public.invites (lower(email));

-- ---------- tournaments (named registry / history) ---------------------------
create table if not exists public.tournaments (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  year            int not null,
  participant_ids jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  published_at    timestamptz
);
create index if not exists tournaments_year_idx on public.tournaments (year);

-- ---------- teach new signups to honor a pending invite ----------------------
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

-- ---------- RLS --------------------------------------------------------------
alter table public.tournaments enable row level security;
alter table public.invites     enable row level security;

drop policy if exists tournaments_read  on public.tournaments;
drop policy if exists tournaments_write on public.tournaments;
create policy tournaments_read  on public.tournaments for select to authenticated using (true);
create policy tournaments_write on public.tournaments for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

drop policy if exists invites_read  on public.invites;
drop policy if exists invites_write on public.invites;
create policy invites_read  on public.invites for select to authenticated using (public.is_moc());
create policy invites_write on public.invites for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

-- ---------- realtime (errors if already added — safe to ignore on re-run) -----
alter publication supabase_realtime add table public.tournaments;
alter publication supabase_realtime add table public.invites;
