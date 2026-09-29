alter table public.cars drop column registration_plate;

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
    drivetrain, condition, description, key_features, location_area,
    vin, cost_price_ngn, asking_price_ngn, status,
    last_verified_at, acquisition_notes
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
    p_car->>'drivetrain',
    p_car->>'condition',
    p_car->>'description',
    case when p_car ? 'key_features'
      then array(select jsonb_array_elements_text(p_car->'key_features'))
      else null
    end,
    p_car->>'location_area',
    p_car->>'vin',
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