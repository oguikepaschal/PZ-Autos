-- save_car_images: reconcile a car's whole image set in one transaction.
--
-- The edit form used to delete, insert and update car_images row by row from
-- the client. car_images_one_cover_per_car is a partial, non-deferrable unique
-- index, so setting a new cover before the old one was cleared raised 23505,
-- the unchecked error was dropped, and the car ended up with no cover.
--
-- p_images items: {id?, storage_path, alt_text, is_cover, sort_order}. An item
-- with an id is an existing row; an item without one is inserted. Rows of the
-- car that are not in the payload are deleted and their storage paths returned
-- so the caller can remove the files. When no item is flagged as the cover, the
-- item with the lowest sort_order becomes the cover.
--
-- Cover is never set inside a multi-row UPDATE: every cover is cleared first,
-- then exactly one row is set.
create or replace function public.save_car_images(p_car_id uuid, p_images jsonb)
returns text[]
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_ids        uuid[];
  v_deleted    text[];
  v_cover_id   uuid;
  v_cover_path text;
  v_rows       integer;
begin
  if p_images is null or jsonb_typeof(p_images) <> 'array' then
    raise exception 'save_car_images: p_images must be a json array';
  end if;

  -- Serialises concurrent saves for the car. Under RLS the row is only visible
  -- to the owner, so a non-owner gets "not found".
  perform 1 from public.cars where id = p_car_id for update;
  if not found then
    raise exception 'save_car_images: car % not found', p_car_id;
  end if;

  select coalesce(array_agg((e->>'id')::uuid) filter (where e->>'id' is not null), '{}')
  into v_ids
  from jsonb_array_elements(p_images) e;

  if cardinality(v_ids) <> (select count(distinct i) from unnest(v_ids) i) then
    raise exception 'save_car_images: duplicate image ids';
  end if;

  if exists (
    select 1 from unnest(v_ids) i
    where not exists (
      select 1 from public.car_images ci where ci.id = i and ci.car_id = p_car_id
    )
  ) then
    raise exception 'save_car_images: image does not belong to car %', p_car_id;
  end if;

  if (
    select count(*) from jsonb_array_elements(p_images) e
    where coalesce((e->>'is_cover')::boolean, false)
  ) > 1 then
    raise exception 'save_car_images: more than one cover';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_images) e
    where e->>'id' is null and coalesce(e->>'storage_path', '') = ''
  ) then
    raise exception 'save_car_images: new image without storage_path';
  end if;

  if (
    select count(*) from jsonb_array_elements(p_images) e where e->>'id' is null
  ) <> (
    select count(distinct e->>'storage_path') from jsonb_array_elements(p_images) e
    where e->>'id' is null
  ) then
    raise exception 'save_car_images: duplicate storage_path';
  end if;

  -- The flagged item, else the lowest sort_order item (payload order breaks ties).
  select (e->>'id')::uuid, e->>'storage_path'
  into v_cover_id, v_cover_path
  from jsonb_array_elements(p_images) with ordinality as t(e, ord)
  order by coalesce((e->>'is_cover')::boolean, false) desc,
           coalesce((e->>'sort_order')::int, 0),
           ord
  limit 1;

  -- a. Delete rows that are no longer present, keeping their paths.
  with d as (
    delete from public.car_images
    where car_id = p_car_id and id <> all (v_ids)
    returning storage_path
  )
  select coalesce(array_agg(storage_path), '{}') into v_deleted from d;

  -- b. Clear the cover on every remaining row.
  update public.car_images set is_cover = false
  where car_id = p_car_id and is_cover;

  -- c. Sort order of existing rows (no unique index on sort_order).
  update public.car_images ci
  set sort_order = coalesce((e->>'sort_order')::int, 0)
  from jsonb_array_elements(p_images) e
  where e->>'id' is not null
    and ci.id = (e->>'id')::uuid
    and ci.car_id = p_car_id;

  -- d. New rows, never as cover.
  insert into public.car_images (car_id, storage_path, alt_text, is_cover, sort_order)
  select p_car_id, e->>'storage_path', e->>'alt_text', false,
         coalesce((e->>'sort_order')::int, 0)
  from jsonb_array_elements(p_images) e
  where e->>'id' is null;

  -- e. Exactly one cover, set on a single row.
  if v_cover_id is not null or v_cover_path is not null then
    update public.car_images set is_cover = true
    where car_id = p_car_id
      and case when v_cover_id is not null then id = v_cover_id
               else storage_path = v_cover_path end;
    get diagnostics v_rows = row_count;
    if v_rows <> 1 then
      raise exception 'save_car_images: expected one cover row, set %', v_rows;
    end if;
  end if;

  return v_deleted;
end;
$$;

revoke execute on function public.save_car_images(uuid, jsonb) from public, anon;
grant execute on function public.save_car_images(uuid, jsonb) to authenticated;

-- Close the same gap on the existing functions: PUBLIC and anon could execute
-- them. is_owner() is only called by authenticated-role policies and by code
-- that checks for a session first, so anon never needs it.
revoke execute on function public.set_car_featured(uuid, boolean) from public, anon;
grant execute on function public.set_car_featured(uuid, boolean) to authenticated;

revoke execute on function public.reorder_featured(uuid[]) from public, anon;
grant execute on function public.reorder_featured(uuid[]) to authenticated;

revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;
