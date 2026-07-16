-- Storage bucket for M.O.C. newsletter PDFs. Public read (same convention as
-- catch-photos/glory-pics), M.O.C.-only upload (matches newsletters_write).
insert into storage.buckets (id, name, public)
values ('newsletter-pdfs', 'newsletter-pdfs', true)
on conflict (id) do nothing;

drop policy if exists "public read newsletter pdfs" on storage.objects;
drop policy if exists "moc write newsletter pdfs" on storage.objects;
create policy "public read newsletter pdfs" on storage.objects for select
  using (bucket_id = 'newsletter-pdfs');
create policy "moc write newsletter pdfs" on storage.objects for insert to authenticated
  with check (bucket_id = 'newsletter-pdfs' and public.is_moc());
