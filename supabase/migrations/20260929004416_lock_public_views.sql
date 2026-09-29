-- anon and authenticated only ever read the public views. Supabase's default
-- privileges gave both roles ALL on them, and public_cars_view is
-- auto-updatable and runs as its owner, so writes through it bypassed RLS on
-- cars. Keep SELECT only.

revoke all on public.public_cars_view, public.public_car_images_view, public.public_featured_cars_view
  from anon, authenticated, public;

grant select on public.public_cars_view, public.public_car_images_view, public.public_featured_cars_view
  to anon, authenticated;
