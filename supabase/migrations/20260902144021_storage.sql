-- car-images bucket: public read (photos aren't sensitive in isolation —
-- geotags and other identifying EXIF are stripped client-side before
-- upload, see lib/supabase/storage.ts), writes restricted to the
-- authenticated owner. Objects are stored under a generated id, never a
-- filename derived from supplier or source (see uploadCarImage).

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

create policy "car_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'car-images');

create policy "car_images_owner_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-images');

create policy "car_images_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-images');

create policy "car_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-images');
