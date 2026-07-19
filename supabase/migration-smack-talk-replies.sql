-- Adds threaded replies to Smack Talk posts. Idempotent.
alter table public.smack_talk add column if not exists replies jsonb not null default '[]';

drop policy if exists smack_talk_update on public.smack_talk;
create policy smack_talk_update on public.smack_talk for update to authenticated
  using (true) with check (true);
