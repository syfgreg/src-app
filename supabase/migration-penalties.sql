-- ============================================================================
-- Sea Robin Classic — migration: M.O.C. scoring penalties
-- Additive. The "Scoring Deficit (Penalty Assessment)" from the scorecard:
-- the M.O.C. deducts points from an angler with a written reason. Run once.
-- (The `alter publication ... add table` line errors only on re-run — ignore.)
-- ============================================================================

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

alter table public.penalties enable row level security;

-- everyone signed in reads (an angler sees their own deficit); only the M.O.C. writes
drop policy if exists penalties_read  on public.penalties;
drop policy if exists penalties_write on public.penalties;
create policy penalties_read  on public.penalties for select to authenticated using (true);
create policy penalties_write on public.penalties for all to authenticated
  using (public.is_moc()) with check (public.is_moc());

alter publication supabase_realtime add table public.penalties;
