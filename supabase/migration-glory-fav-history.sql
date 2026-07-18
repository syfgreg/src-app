-- Permanent Glory Shot Fav ballot archive — written once per year when
-- voting closes, so a ballot's photos/votes/winner survive forever no
-- matter what happens to public.glory_pics afterward. Idempotent.
create table if not exists public.glory_fav_history (
  id          uuid primary key default gen_random_uuid(),
  year        int not null,
  source_id   uuid,
  photo_url   text not null,
  submitter   text not null,
  description text,
  votes       int not null default 0,
  is_winner   boolean not null default false,
  archived_at timestamptz not null default now()
);
create index if not exists glory_fav_history_year_idx on public.glory_fav_history (year);

alter table public.glory_fav_history enable row level security;

drop policy if exists glory_history_read  on public.glory_fav_history;
drop policy if exists glory_history_write on public.glory_fav_history;
create policy glory_history_read  on public.glory_fav_history for select to authenticated using (true);
create policy glory_history_write on public.glory_fav_history for all to authenticated
  using (public.is_moc()) with check (public.is_moc());
