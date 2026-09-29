-- Baseline schema for PZ Autos: suppliers, cars, car_images, enquiries.
--
-- Business model recap (drives every design choice below): the owner never
-- holds a car — each one belongs to a third-party dealership or individual.
-- Supplier identity and cost price are business-critical secrets and must
-- never be reachable through the public views (see
-- 20260902000001_public_views.sql). That is enforced structurally here by
-- putting supplier data in its own table with no anon grant at all, rather
-- than trusting every future view definition to remember to omit columns.

create extension if not exists "pgcrypto";

-- ── suppliers ────────────────────────────────────────────────────────────
-- One row per dealership or individual who has ever held a car the owner
-- brokers. Never exposed to anon; no public view references this table.

create table public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  supplier_type text not null check (supplier_type in ('dealership', 'individual')),
  contact_phone text,
  contact_email text,
  address       text,
  notes         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.suppliers is
  'Third-party dealerships/individuals who hold cars the owner brokers. Business-confidential — no anon grant, no public view ever references this table.';

-- ── cars ─────────────────────────────────────────────────────────────────

create table public.cars (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,

  supplier_id        uuid not null references public.suppliers(id) on delete restrict,

  make               text not null,
  model              text not null,
  year               integer not null check (year between 1980 and (extract(year from now())::int + 1)),
  trim               text,
  body_type          text,
  transmission       text,
  fuel_type          text,
  mileage_km         integer check (mileage_km is null or mileage_km >= 0),
  exterior_colour    text,
  interior_colour    text,
  engine             text,
  drivetrain         text,
  condition          text,
  description        text,
  key_features       text[],
  location_area      text, -- LGA-level only (e.g. "Ikeja") — never a street address

  -- Admin-only identifiers. Same threat class as supplier identity: either
  -- one lets a buyer find this exact car listed at the source's own price.
  vin                text,
  registration_plate text,

  -- Two prices. Only asking_price_ngn may ever appear in a public view.
  cost_price_ngn     numeric(12, 2) check (cost_price_ngn is null or cost_price_ngn >= 0),
  asking_price_ngn   numeric(12, 2) not null check (asking_price_ngn > 0),

  -- Status model:
  --   draft     - not yet published, admin-only, never public
  --   available - live, brokerable
  --   reserved  - deposit taken / on hold, still public
  --   sold      - the owner brokered this sale; archived but stays public
  --               as portfolio proof
  --   withdrawn - sold elsewhere or pulled by the supplier; archived and
  --               NEVER public — the owner did not broker this sale and
  --               must not imply otherwise
  -- text+check rather than a Postgres enum: this list will likely grow,
  -- and enum value changes carry real migration friction (ALTER TYPE
  -- transactional restrictions, full-type rebuilds to remove a value).
  status             text not null default 'draft'
                        check (status in ('draft', 'available', 'reserved', 'sold', 'withdrawn')),
  status_changed_at  timestamptz not null default now(),
  archive_reason     text,

  -- Verification freshness. The owner does not control this inventory —
  -- a car can sell elsewhere without notice. Staleness is an admin signal
  -- only; it never filters the public listing (last_verified_at may also
  -- be surfaced publicly as evidence of the "verified before listing"
  -- trust story, but only when genuinely fresh).
  last_verified_at   timestamptz not null default now(),

  -- Featured curation for the landing page. featured_order is meaningful
  -- only while is_featured is true; the app never lets these two disagree
  -- (create_car_with_images / set_car_featured / reorder_featured own every
  -- write path — see 20260902000002_rpc_functions.sql).
  is_featured        boolean not null default false,
  featured_order     integer,

  -- Internal notes on the supplier relationship for this specific car
  -- (terms discussed, hold conditions, etc). Admin-only.
  acquisition_notes  text,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint featured_order_iff_featured check (
    (is_featured and featured_order is not null) or
    (not is_featured and featured_order is null)
  ),
  -- A draft or archived car cannot occupy a landing-page slot.
  constraint featured_requires_active_status check (
    not is_featured or status in ('available', 'reserved')
  )
);

-- Two featured cars can never claim the same slot — this is what actually
-- keeps the curated order deterministic; gaps in the sequence (1,2,4,7) are
-- purely cosmetic and never break rendering, so they are not guarded here.
create unique index cars_featured_order_uniq on public.cars (featured_order) where is_featured;

create index cars_status_idx on public.cars (status);
create index cars_supplier_id_idx on public.cars (supplier_id);
create index cars_last_verified_at_idx on public.cars (last_verified_at);

comment on column public.cars.cost_price_ngn is 'NEVER expose via a public view — see public_cars_view SELECT list.';
comment on column public.cars.vin is 'Admin-only. Lets a buyer trace this exact car to the supplier''s own listing.';
comment on column public.cars.registration_plate is 'Admin-only, same reason as vin.';

-- ── car_images ───────────────────────────────────────────────────────────

create table public.car_images (
  id           uuid primary key default gen_random_uuid(),
  car_id       uuid not null references public.cars(id) on delete cascade,
  storage_path text not null,
  alt_text     text,
  is_cover     boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- One cover photo per car. This also gives create_car_with_images a natural
-- failure mode to test atomicity against (two images both marked cover).
create unique index car_images_one_cover_per_car on public.car_images (car_id) where is_cover;
create index car_images_car_id_idx on public.car_images (car_id);

-- ── enquiries ────────────────────────────────────────────────────────────
-- Written exclusively through the service-role client from a server-side
-- API route (rate-limited) — never directly from the browser with the anon
-- key, so no anon grant is needed on this table at all.

create table public.enquiries (
  id         uuid primary key default gen_random_uuid(),
  car_id     uuid references public.cars(id) on delete set null,
  name       text,
  phone      text,
  message    text,
  source     text not null default 'website',
  created_at timestamptz not null default now()
);

create index enquiries_car_id_idx on public.enquiries (car_id);

-- ── updated_at maintenance ──────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

create trigger cars_set_updated_at
  before update on public.cars
  for each row execute function public.set_updated_at();

-- ── status transition side effects ──────────────────────────────────────
-- Keeps status_changed_at honest and stops a car that just sold or was
-- withdrawn from continuing to occupy a featured slot on the landing page.

create function public.compact_featured_order()
returns void
language sql
set search_path = public, pg_temp
as $$
  update public.cars c
  set featured_order = ranked.rn
  from (
    select id, row_number() over (order by featured_order) as rn
    from public.cars
    where is_featured
  ) ranked
  where c.id = ranked.id and c.featured_order != ranked.rn;
$$;

create function public.handle_car_status_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();

    if new.status in ('sold', 'withdrawn') and new.is_featured then
      new.is_featured = false;
      new.featured_order = null;
    end if;
  end if;
  return new;
end;
$$;

create trigger cars_handle_status_change
  before update on public.cars
  for each row execute function public.handle_car_status_change();

-- The BEFORE trigger above only fixes the row being updated; compact
-- whatever gap it left in the featured sequence afterward.
create function public.compact_featured_order_after_status_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status in ('sold', 'withdrawn') and old.is_featured and not new.is_featured then
    perform public.compact_featured_order();
  end if;
  return new;
end;
$$;

create trigger cars_compact_featured_after_status_change
  after update on public.cars
  for each row execute function public.compact_featured_order_after_status_change();
