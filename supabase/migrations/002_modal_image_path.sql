-- Optional image used only inside the content modal.
alter table public.materials add column if not exists modal_image_path text;

drop policy if exists purchased_files on storage.objects;
create policy purchased_files on storage.objects for select to authenticated using (
  bucket_id = 'materials' and exists (
    select 1 from public.materials m where m.published
      and (m.image_path = name or m.modal_image_path = name or m.file_path = name)
      and public.has_product_access(m.product_id)
  )
);
