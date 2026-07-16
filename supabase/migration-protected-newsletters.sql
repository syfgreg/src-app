-- Newsletters can be flagged undeletable (used for the historical archive
-- import). Enforced at the RLS layer, not just hidden in the UI.
alter table public.newsletters
  add column if not exists protected boolean not null default false;

-- Split the old blanket "for all" write policy into insert/update (unrestricted
-- for M.O.C.) and delete (M.O.C. AND not protected).
drop policy if exists newsletters_write on public.newsletters;
drop policy if exists newsletters_insert on public.newsletters;
drop policy if exists newsletters_update on public.newsletters;
drop policy if exists newsletters_delete on public.newsletters;
create policy newsletters_insert on public.newsletters for insert to authenticated
  with check (public.is_moc());
create policy newsletters_update on public.newsletters for update to authenticated
  using (public.is_moc()) with check (public.is_moc());
create policy newsletters_delete on public.newsletters for delete to authenticated
  using (public.is_moc() and not protected);

-- Mark the historical archive import (the 15 "SRC <year> Newsletter" posts,
-- created 2026-07-16) as protected.
update public.newsletters set protected = true
where title ~ '^SRC \d{4} Newsletter$';
