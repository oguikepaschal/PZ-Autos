-- Drops cars.engine now that cars.engine_layout (added in
-- 20260902000005_add_engine_layout.sql) covers the same information for
-- admin/buyer purposes. Keeping both invited exactly the redundancy it was
-- meant to avoid — admins were filling engine with the same value as
-- engine_layout (e.g. "V6" in both) rather than genuine displacement/turbo
-- notes. Dropping the column (not just hiding the form field) is a real
-- data loss for any car whose engine value was more than that duplication,
-- but the owner confirmed that trade-off explicitly.

-- create_car_with_images no longer accepts/reads p_car->>'engine'.
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
    fuel_type, mileage_km, exterior_colour, interior_colour,
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

-- Public views select columns by name, not `select *` over the base table,
-- so they need to stop exposing the dropped column. CREATE OR REPLACE VIEW
-- can only append columns, never remove one — dropping `engine` from the
-- middle of the list means both views must be dropped and recreated
-- (featured first: it depends on public_cars_view via `select *`).
drop view public.public_featured_cars_view;
drop view public.public_cars_view;

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

create view public.public_featured_cars_view
with (security_invoker = false, security_barrier = true) as
select *
from public.public_cars_view
where is_featured and status in ('available', 'reserved')
order by featured_order
limit 6;

grant select on public.public_cars_view to anon, authenticated;
grant select on public.public_featured_cars_view to anon, authenticated;

alter table public.cars drop column engine;

comment on column public.cars.engine_layout is
  'Cylinder/motor layout (I4, V6, Electric, ...). Replaced the free-text engine column.';
