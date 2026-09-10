insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 20971520, array['image/svg+xml','image/png','image/jpeg','image/webp']),
  ('user-files', 'user-files', false, 20971520, array['image/svg+xml','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "user_files_select_own" on storage.objects for select to authenticated
using (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "user_files_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "user_files_update_own" on storage.objects for update to authenticated
using (bucket_id = 'user-files' and owner_id = (select auth.uid()::text))
with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "user_files_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'user-files' and owner_id = (select auth.uid()::text));
