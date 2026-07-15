-- Web Push: device subscription registry. Read only by the send-push
-- Netlify function (service role, bypasses RLS) — never joined by the client.
create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subs_read   on public.push_subscriptions;
drop policy if exists push_subs_insert on public.push_subscriptions;
drop policy if exists push_subs_update on public.push_subscriptions;
drop policy if exists push_subs_delete on public.push_subscriptions;
create policy push_subs_read   on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_subs_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_subs_update on public.push_subscriptions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy push_subs_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());
