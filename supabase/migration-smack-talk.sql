-- Smack Talk board — trash-talk posts, open the same window as Glory Shot
-- submissions (Jan 1 - Sep 30). Idempotent.
create table if not exists public.smack_talk (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  message    text not null,
  created_at timestamptz not null default now()
);
create index if not exists smack_talk_created_idx on public.smack_talk (created_at);

alter table public.smack_talk enable row level security;

drop policy if exists smack_talk_read   on public.smack_talk;
drop policy if exists smack_talk_insert on public.smack_talk;
drop policy if exists smack_talk_delete on public.smack_talk;
create policy smack_talk_read   on public.smack_talk for select to authenticated using (true);
create policy smack_talk_insert on public.smack_talk for insert to authenticated
  with check (user_id = auth.uid());
create policy smack_talk_delete on public.smack_talk for delete to authenticated
  using (public.is_moc());

alter publication supabase_realtime add table public.smack_talk;
