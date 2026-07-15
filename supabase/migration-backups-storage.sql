-- Storage: let the M.O.C.'s own browser session list/download files from the
-- "backups" bucket directly (writes stay server-side via the service role key
-- in the Netlify backup function, which bypasses RLS entirely).
drop policy if exists "moc read backups" on storage.objects;
create policy "moc read backups" on storage.objects for select to authenticated
  using (bucket_id = 'backups' and public.is_moc());
