-- Lets the M.O.C. delete a Glory Shot from the board (moderation). Idempotent.
drop policy if exists glory_delete on public.glory_pics;
create policy glory_delete on public.glory_pics for delete to authenticated
  using (public.is_moc());
