-- Unfeaturing used to renumber every remaining featured car in one UPDATE
-- (compact_featured_order). cars_featured_order_uniq is not deferrable, so
-- Postgres checks it row by row and the renumbering collided mid-statement
-- (23505). Gaps in featured_order are harmless (the public view only orders
-- by it), so compaction is removed everywhere instead of being made safe.
--
-- Position-assigning functions also serialise on one advisory lock so two
-- concurrent calls cannot read the same max() and collide. The status-change
-- trigger only ever sets featured_order to NULL, which cannot violate the
-- index, so it takes no lock.

drop trigger cars_compact_featured_after_status_change on public.cars;
drop function public.compact_featured_order_after_status_change();

create or replace function public.set_car_featured(p_car_id uuid, p_featured boolean)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_next_order integer;
  v_status     text;
begin
  perform pg_advisory_xact_lock(hashtext('cars_featured_order'));

  if p_featured then
    select status into v_status from public.cars where id = p_car_id;
    if v_status not in ('available', 'reserved') then
      raise exception 'set_car_featured: only available/reserved cars can be featured (status is %)', v_status;
    end if;

    select coalesce(max(featured_order), 0) + 1 into v_next_order
    from public.cars where is_featured;

    update public.cars
    set is_featured = true, featured_order = v_next_order
    where id = p_car_id and not is_featured;
  else
    update public.cars
    set is_featured = false, featured_order = null
    where id = p_car_id;
  end if;
end;
$$;

create or replace function public.reorder_featured(p_ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_current_count integer;
  v_given_count integer;
begin
  perform pg_advisory_xact_lock(hashtext('cars_featured_order'));

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

drop function public.compact_featured_order();
