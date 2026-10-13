-- car-images is a public bucket, so /storage/v1/object/public/... serves
-- images without any storage.objects SELECT policy. car_images_public_read
-- therefore only enabled anon (and any authenticated user) to list and
-- authenticated-download every object through the Storage API, including
-- images of draft and withdrawn cars.
--
-- Listing and removing through the owner session still needs SELECT
-- visibility (deleteCarImagesByPrefix in lib/supabase/storage.ts), so SELECT
-- is kept for the owner only. Images of non-visible cars stay reachable by
-- exact public URL until the bucket is made private.

drop policy "car_images_public_read" on storage.objects;

create policy "car_images_owner_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'car-images' and (select public.is_owner()));
