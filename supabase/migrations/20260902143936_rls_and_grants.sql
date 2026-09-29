-- Single-owner RLS: authenticated (the one signed-in owner — see
-- supabase/config.toml, signups are disabled) gets full read/write on every
-- base table. anon gets NOTHING on base tables — public access exists only
-- through the views in the next migration, which run with the view owner's
-- privileges and are granted to anon explicitly, column-by-column.

alter table public.suppliers enable row level security;
alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.enquiries enable row level security;

create policy "owner_full_access" on public.suppliers
  for all to authenticated using (true) with check (true);

create policy "owner_full_access" on public.cars
  for all to authenticated using (true) with check (true);

create policy "owner_full_access" on public.car_images
  for all to authenticated using (true) with check (true);

create policy "owner_full_access" on public.enquiries
  for all to authenticated using (true) with check (true);

revoke all on public.suppliers, public.cars, public.car_images, public.enquiries
  from anon, public;

grant select, insert, update, delete on public.suppliers to authenticated;
grant select, insert, update, delete on public.cars to authenticated;
grant select, insert, update, delete on public.car_images to authenticated;
-- enquiries: owner reads/manages them in admin, but writes come only from
-- the service-role client (bypasses RLS) via a server-side API route.
grant select, update, delete on public.enquiries to authenticated;
