-- Phase 1 / 4: bucket `attachments` (private) cho ảnh đính kèm (dùng ở Phase 5).
-- Quy ước đường dẫn: {auth.uid()}/<tên file>. User chỉ truy cập file trong thư mục của mình.

insert into storage.buckets (id, name, public, file_size_limit)
values ('attachments', 'attachments', false, 10485760) -- 10 MiB
on conflict (id) do nothing;

create policy "attachments_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "attachments_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
