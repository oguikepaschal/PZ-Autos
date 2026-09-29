-- Public showcase views. Three requirements, all structural rather than
-- reviewer-discipline:
--
--   1. Supplier identity and cost price are never in the SELECT list of any
--      view granted to anon (enforced by suppliers having no anon grant at
--      all, and by simply never selecting cars.cost_price_ngn/vin/
--      registration_plate here).
--   2. public_car_images_view applies the IDENTICAL visibility predicate as
--      public_cars_view. The predicate lives in exactly one place —
--      car_is_publicly_visible() — so the two views cannot drift apart the
--      way they did in the reference codebase this was ported from (that
--      images view shipped with no WHERE clause at all and leaked photos of
--      hidden/sold cars to a direct anon-key query).
--   3. public_featured_cars_view derives from public_cars_view rather than
--      restating its predicate, then narrows further (status must still be
--      active — a trigger already unfeatures on sold/withdrawn, this is
--      defence in depth) and caps at 6.
--
-- All three run with the view owner's privileges (the migration role, which
-- owns the underlying tables and therefore bypasses their RLS) rather than
-- the invoking role's — that is the mechanism that lets anon read curated
-- car data despite holding zero grants on cars/car_images. Do not add
-- `security_invoker = true` to any of these views; that would break public
-- access entirely, not tighten it.

create function public.car_is_publicly_visible(c public.cars)
returns boolean
language sql
immutable
set search_path = public, pg_temp
as $$
  select c.status in ('available', 'reserved', 'sold')
$$;

create view public.public_cars_view
with (security_invoker = false, security_barrier = true) as
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
  engine,
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
  updated_at
  -- Deliberately absent: supplier_id, cost_price_ngn, vin,
  -- registration_plate, acquisition_notes, archive_reason.
from public.cars c
where public.car_is_publicly_visible(c);

create view public.public_car_images_view
with (security_invoker = false, security_barrier = true) as
select
  ci.id,
  ci.car_id,
  ci.storage_path,
  ci.alt_text,
  ci.is_cover,
  ci.sort_order
from public.car_images ci
join public.cars c on c.id = ci.car_id
where public.car_is_publicly_visible(c);

create view public.public_featured_cars_view
with (security_invoker = false, security_barrier = true) as
select *
from public.public_cars_view
where is_featured and status in ('available', 'reserved')
order by featured_order
limit 6;

grant select on public.public_cars_view to anon, authenticated;
grant select on public.public_car_images_view to anon, authenticated;
grant select on public.public_featured_cars_view to anon, authenticated;
