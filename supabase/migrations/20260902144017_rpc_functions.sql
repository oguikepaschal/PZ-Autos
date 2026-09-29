-- Admin-only RPCs. All run as `security invoker` (the caller's own
-- privileges) — the single owner already has full table access via RLS, so
-- there is no need to elevate, and keeping these at invoker privilege means
-- a bug here can never do more than the calling role could already do
-- directly.

-- ── create_car_with_images ──────────────────────────────────────────────
-- Car creation must be atomic: the car row and every one of its images
-- exist together or not at all. Wrapping both inserts in one function gives
-- that for free — a Postgres function body is one transaction, so any
-- failure (a bad FK, a second image claiming is_cover, a check violation)
-- rolls back the whole thing and leaves no car row.
--
-- This function does NOT touch Storage — photos are uploaded to Storage
-- under a temporary folder id by the client before this is called, and this
-- only writes the DB rows that reference them. If this call throws, the
-- client is responsible for deleting those already-uploaded Storage objects
-- (Storage writes are a separate system and cannot participate in this
-- transaction) — see lib/supabase/storage.ts::createCarWithImages.

create function public.create_car_with_images(p_car jsonb, p_images jsonb)
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
    vin, registration_plate, cost_price_ngn, asking_price_ngn, status,
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

-- ── set_car_featured ────────────────────────────────────────────────────
-- The only sanctioned way to flip is_featured. Assigns the next slot on
-- feature; on unfeature, nulls the slot and compacts the remaining
-- sequence in the same statement so gaps never accumulate mid-session.

create function public.set_car_featured(p_car_id uuid, p_featured boolean)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_next_order integer;
  v_status     text;
begin
  if p_featured then
    select status into v_status from public.cars where id = p_car_id;
    if v_status not in ('available', 'reserved') then
      raise exception 'set_car_featured: only available/reserved cars can be featured (status is %)', v_status;
    end if;

    select coalesce(max(featured_order), 0) + 1 into v_next_order
    from public.cars where is_featured;

    update public.cars
    set is_featured = true, featured_order = v_next_order
    where id = p_car_id;
  else
    update public.cars
    set is_featured = false, featured_order = null
    where id = p_car_id;

    perform public.compact_featured_order();
  end if;
end;
$$;

grant execute on function public.set_car_featured(uuid, boolean) to authenticated;

-- ── reorder_featured ─────────────────────────────────────────────────────
-- Backs the admin arrow-button reordering. Takes the complete new order as
-- an array of car ids. Writes negated positions first, then flips them
-- positive in a second statement — with the partial unique index on
-- featured_order, swapping two adjacent rows in one UPDATE would otherwise
-- transiently collide mid-statement.

create function public.reorder_featured(p_ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_current_count integer;
  v_given_count integer;
begin
  select count(*) into v_current_count from public.cars where is_featured;
  v_given_count := coalesce(array_length(p_ordered_ids, 1), 0);

  if v_given_count != v_current_count
     or v_given_count != (select count(distinct x) from unnest(p_ordered_ids) x)
     or exists (
       select 1 from unnest(p_ordered_ids) id
       where id not in (select id from public.cars where is_featured)
     )
  then
    raise exception 'reorder_featured: ordered_ids must be exactly the current featured set, no duplicates or omissions';
  end if;

  update public.cars c
  set featured_order = -ranked.rn
  from (
    select id, rn from unnest(p_ordered_ids) with ordinality as t(id, rn)
  ) ranked
  where c.id = ranked.id;

  update public.cars c
  set featured_order = -featured_order
  where c.is_featured and c.featured_order < 0;
end;
$$;

grant execute on function public.reorder_featured(uuid[]) to authenticated;
