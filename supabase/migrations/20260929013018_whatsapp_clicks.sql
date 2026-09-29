-- One row per tap on the public "Chat on WhatsApp" button. Only car_id and
-- created_at are stored: no IP, user agent or other visitor data. Rows are
-- written by the service-role client from /api/whatsapp-click (which bypasses
-- RLS), so no role a buyer can hold has any write access. The owner reads
-- the counts in admin.

create table public.whatsapp_clicks (
  id         uuid primary key default gen_random_uuid(),
  car_id     uuid not null references public.cars(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index whatsapp_clicks_car_id_idx on public.whatsapp_clicks (car_id);

alter table public.whatsapp_clicks enable row level security;

create policy "owner_select" on public.whatsapp_clicks
  for select to authenticated
  using ((select public.is_owner()));

revoke all on public.whatsapp_clicks from anon, authenticated, public;
grant select on public.whatsapp_clicks to authenticated;
