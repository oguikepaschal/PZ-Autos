alter table public.cars add column registration_plate text;
comment on column public.cars.registration_plate is 'Admin-only, same reason as vin.';