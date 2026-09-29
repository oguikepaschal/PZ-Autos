-- Enforce the single-owner model at the database layer. Until now every
-- owner policy checked only `to authenticated`, so any provisioned auth user
-- would have had full access, cost price and supplier identity included.
--
-- is_owner() is the one place the owner's identity lives. Every owner policy
-- below and the app-layer guard (lib/adminApiGuard.ts) call it; nothing else
-- may restate the UUID.
--
-- Untouched on purpose: the public views and their anon grants, the
-- car_images_public_read storage policy, and the service-role enquiry path
-- (service role bypasses RLS).

-- coalesce in the body: auth.uid() is null for anon, and callers want a plain
-- false.
create function public.is_owner()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(auth.uid() = 'bdf8c376-dbec-42c9-96d3-731aff1ce4f6'::uuid, false)
$$;

grant execute on function public.is_owner() to authenticated;

-- ── Base tables ─────────────────────────────────────────────────────────
-- `(select public.is_owner())` rather than a bare call: Postgres evaluates
-- the subselect once per statement instead of once per row.

drop policy "owner_full_access" on public.suppliers;
create policy "owner_full_access" on public.suppliers
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy "owner_full_access" on public.cars;
create policy "owner_full_access" on public.cars
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy "owner_full_access" on public.car_images;
create policy "owner_full_access" on public.car_images
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy "owner_full_access" on public.enquiries;
create policy "owner_full_access" on public.enquiries
  for all to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

-- ── car-images bucket writes ────────────────────────────────────────────
-- Public read (car_images_public_read) is left as is.

drop policy "car_images_owner_write" on storage.objects;
create policy "car_images_owner_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-images' and (select public.is_owner()));

drop policy "car_images_owner_update" on storage.objects;
create policy "car_images_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-images' and (select public.is_owner()));

drop policy "car_images_owner_delete" on storage.objects;
create policy "car_images_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-images' and (select public.is_owner()));
