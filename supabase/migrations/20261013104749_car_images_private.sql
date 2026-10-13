-- car-images becomes a private bucket. Until now every object was readable by
-- exact URL (/object/public/ and /object/authenticated/), including photos of
-- draft and withdrawn cars.
--
-- Showcase photos are served by /img/<path>, which downloads with the anon
-- key. The anon SELECT policy below is what lets that work, and only for photos
-- whose car passes car_is_publicly_visible — the visibility rule stays in that
-- function. Photos of any other car, and objects with no car_images row, are
-- invisible to anon. The owner's read/write/update/delete policies are
-- unchanged.
--
-- The policy goes first and the bucket is flipped in the same transaction, so
-- there is no moment where visible photos are unreadable.

create policy "car_images_anon_read_visible"
  on storage.objects for select
  to anon
  using (
    bucket_id = 'car-images'
    and exists (
      select 1
      from public.car_images ci
      join public.cars c on c.id = ci.car_id
      where ci.storage_path = storage.objects.name
        and public.car_is_publicly_visible(c.status)
    )
  );

update storage.buckets
set public = false
where id = 'car-images';
