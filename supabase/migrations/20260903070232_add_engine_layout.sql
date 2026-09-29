-- Adds cars.engine_layout (cylinder/motor configuration — I4, V6, Electric,
-- etc.), introduced alongside the admin-form dropdown constraints. Kept
-- distinct from the existing free-text `engine` column, which stays for
-- displacement/turbo notes (e.g. "3.5L Twin-Turbo") that a fixed layout
-- list can't express.
--
-- No CHECK constraint: the admin form is now the enforcement point for the
-- canonical option list (lib/carOptions.ts), and that list is expected to
-- grow. A DB-level check would need a migration every time it does, and
-- would reject a legacy value the form deliberately still preserves during
-- edit (see lib/carFormSchema.ts) — same rationale as the existing
-- transmission/fuel_type/drivetrain/body_type columns, which were never
-- check-constrained either.

alter table public.cars add column engine_layout text;

comment on column public.cars.engine_layout is
  'Cylinder/motor layout (I4, V6, Electric, ...) — distinct from the free-text engine column.';

-- Public showcase surfaces engine_layout the same way it already surfaces
-- engine/transmission/drivetrain: a genuine buyer-facing spec, not
-- business-confidential like vin/registration_plate/cost_price_ngn.
create or replace view public.public_cars_view
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
  updated_at,
  engine_layout
  -- Deliberately absent: supplier_id, cost_price_ngn, vin,
  -- registration_plate, acquisition_notes, archive_reason.
from public.cars c
where public.car_is_publicly_visible(c);

-- Re-created (not just left alone) so its `select *` picks up the new
-- engine_layout column from the view above.
create or replace view public.public_featured_cars_view
with (security_invoker = false, security_barrier = true) as
select *
from public.public_cars_view
where is_featured and status in ('available', 'reserved')
order by featured_order
limit 6;

grant select on public.public_cars_view to anon, authenticated;
grant select on public.public_featured_cars_view to anon, authenticated;

-- create_car_with_images needs the new column in its insert list.
create or replace function public.create_car_with_images(p_car jsonb, p_images jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_car_id uuid;
  v_image  jsonb;
begin
  insert into public.cars (
    slug, supplier_id, make, model, year, trim, body_type, transmission,
    fuel_type, mileage_km, exterior_colour, interior_colour, engine,
    engine_layout, drivetrain, condition, description, key_features,
    location_area, vin, registration_plate, cost_price_ngn,
    asking_price_ngn, status, last_verified_at, acquisition_notes
  )
  values (
    p_car->>'slug',
    (p_car->>'supplier_id')::uuid,
    p_car->>'make',
    p_car->>'model',
    (p_car->>'year')::int,
    p_car->>'trim',
    p_car->>'body_type',
    p_car->>'transmission',
    p_car->>'fuel_type',
    nullif(p_car->>'mileage_km', '')::int,
    p_car->>'exterior_colour',
    p_car->>'interior_colour',
    p_car->>'engine',
    p_car->>'engine_layout',
    p_car->>'drivetrain',
    p_car->>'condition',
    p_car->>'description',
    case when p_car ? 'key_features'
      then array(select jsonb_array_elements_text(p_car->'key_features'))
      else null
    end,
    p_car->>'location_area',
    p_car->>'vin',
    p_car->>'registration_plate',
    nullif(p_car->>'cost_price_ngn', '')::numeric,
    (p_car->>'asking_price_ngn')::numeric,
    coalesce(p_car->>'status', 'draft'),
    coalesce((p_car->>'last_verified_at')::timestamptz, now()),
    p_car->>'acquisition_notes'
  )
  returning id into v_car_id;

  for v_image in select jsonb_array_elements(p_images)
  loop
    insert into public.car_images (car_id, storage_path, alt_text, is_cover, sort_order)
    values (
      v_car_id,
      v_image->>'storage_path',
      v_image->>'alt_text',
      coalesce((v_image->>'is_cover')::boolean, false),
      coalesce((v_image->>'sort_order')::int, 0)
    );
  end loop;

  return v_car_id;
end;
$$;

grant execute on function public.create_car_with_images(jsonb, jsonb) to authenticated;
