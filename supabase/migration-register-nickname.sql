-- Registration now collects a required nickname; store it on the new profile
-- row from auth signup metadata. Idempotent (create or replace).
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

  insert into public.profiles (id, email, name, nickname, role_tag)
  values (
    new.id,
    new.email,
    coalesce(invited.name, new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'nickname',
    coalesce(invited.role_tag, 'JAFNG')
  )
  on conflict (id) do nothing;

  if invited.id is not null then
    delete from public.invites where lower(email) = lower(new.email);
  end if;

  return new;
end;
$$;
