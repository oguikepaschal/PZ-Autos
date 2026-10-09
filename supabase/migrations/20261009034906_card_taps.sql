-- One row per counted tap on a public car card's photo or name. Only car_id
-- and created_at are stored: no IP, user agent or other visitor data. Rows
-- are written by the service-role client from /api/card-tap (which bypasses
-- RLS), so no role a buyer can hold has any write access. The owner reads
-- the counts in admin.

create table public.card_taps (
  id         uuid primary key default gen_random_uuid(),
  car_id     uuid not null references public.cars(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index card_taps_car_id_idx on public.card_taps (car_id);

alter table public.card_taps enable row level security;

create policy "owner_select" on public.card_taps
  for select to authenticated
  using ((select public.is_owner()));

revoke all on public.card_taps from anon, authenticated, public;
grant select on public.card_taps to authenticated;
