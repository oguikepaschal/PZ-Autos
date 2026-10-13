-- Converts the three public showcase views from SECURITY DEFINER behaviour
-- (security_invoker = false, which bypasses RLS on cars and car_images) to
-- security_invoker = true. anon now gets exactly what the views need at the
-- base-table level: column-level SELECT on the showcase columns plus an anon
-- SELECT policy that encodes "publicly visible". supplier_id, vin,
-- cost_price_ngn, acquisition_notes, archive_reason and registration_plate
-- (and car_images.created_at) are never granted to anon.
--
-- To expose a new cars/car_images column on a public view, also
-- `grant select (<column>) on public.<table> to anon;` -- an invoker view over
-- an ungranted column fails with "permission denied" for anon.

-- 1. Visibility predicate takes the status column instead of the whole row.
--    A whole-row reference (c.*) needs SELECT on every column of cars, which
--    anon deliberately does not have. Still SECURITY INVOKER, still pure.
create function public.car_is_publicly_visible(p_status text)
returns boolean
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select p_status in ('available', 'reserved', 'sold')
$$;

-- Explicit grants: the invoker views and anon policies call this as anon.
revoke execute on function public.car_is_publicly_visible(text) from public, anon;
grant execute on function public.car_is_publicly_visible(text) to anon, authenticated, service_role;

-- 2. Column-level grants for anon (no table-level grants).
revoke all on public.cars, public.car_images from anon;

grant select (
  id, slug, make, model, year, trim, body_type, transmission, fuel_type,
  mileage_km, exterior_colour, interior_colour, drivetrain, condition,
  description, key_features, location_area, asking_price_ngn, status,
  status_changed_at, last_verified_at, is_featured, featured_order,
  created_at, updated_at, engine_layout, variant, state
) on public.cars to anon;

grant select (
  id, car_id, storage_path, alt_text, is_cover, sort_order
) on public.car_images to anon;

-- 3. anon SELECT policies. TO anon only: authenticated already holds
--    table-level SELECT, so a policy for it would expose the withheld columns
--    to non-owner sessions. owner_full_access is untouched.
create policy anon_select_visible_cars on public.cars
  for select to anon
  using (public.car_is_publicly_visible(status));

create policy anon_select_visible_car_images on public.car_images
  for select to anon
  using (
    exists (
      select 1
      from public.cars c
      where c.id = car_images.car_id
        and public.car_is_publicly_visible(c.status)
    )
  );

-- 4. Views: same columns and predicate, now security_invoker. Existing
--    SELECT grants on the views carry over through CREATE OR REPLACE.
create or replace view public.public_cars_view
with (security_invoker = true, security_barrier = true) as
select
  id,
  slug,
  make,
  model,
  year,
  trim,
  body_type,
  transmission,
  fuel_type,
  mileage_km,
  exterior_colour,
  interior_colour,
  drivetrain,
  condition,
  description,
  key_features,
  location_area,
  asking_price_ngn,
  status,
  status_changed_at,
  last_verified_at,
  is_featured,
  featured_order,
  created_at,
  updated_at,
  engine_layout,
  variant,
  state
  -- Deliberately absent: supplier_id, cost_price_ngn, vin,
  -- registration_plate, acquisition_notes, archive_reason.
from public.cars c
where public.car_is_publicly_visible(c.status);

create or replace view public.public_car_images_view
with (security_invoker = true, security_barrier = true) as
select
  ci.id,
  ci.car_id,
  ci.storage_path,
  ci.alt_text,
  ci.is_cover,
  ci.sort_order
from public.car_images ci
join public.cars c on c.id = ci.car_id
where public.car_is_publicly_visible(c.status);

alter view public.public_featured_cars_view set (security_invoker = true, security_barrier = true);

-- 5. The whole-row overload has no callers left.
drop function public.car_is_publicly_visible(public.cars);

-- Rollback (manual; not run by this migration):
--   create function public.car_is_publicly_visible(c public.cars) returns boolean
--     language sql immutable security invoker set search_path = public, pg_temp
--     as $$ select c.status in ('available', 'reserved', 'sold') $$;
--   -- recreate public_cars_view and public_car_images_view with
--   --   (security_invoker = false, security_barrier = true) and
--   --   `where public.car_is_publicly_visible(c)` as in 20261010094000_add_car_state.sql
--   alter view public.public_featured_cars_view set (security_invoker = false);
--   drop policy anon_select_visible_car_images on public.car_images;
--   drop policy anon_select_visible_cars on public.cars;
--   revoke all on public.cars, public.car_images from anon;
--   drop function public.car_is_publicly_visible(text);
