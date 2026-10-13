# Design Authority

PZ Autos design tokens are the source of truth and override any default from an installed design or Impeccable skill:

- Typefaces: Archivo and Barlow
- Primary color: `#141414`
- Signal red: `#D0121B`, capped at 5% of visual weight
- Base color: `#F2F2F4` (the light-theme page background; dark theme `#000000`)

Where two installed skills disagree with each other (not with these tokens), stop and ask before choosing one.

## Animation timing

- All UI animation stays at or under 300ms.
- Exception: 500–800ms is allowed only for a rare focal entrance on a marketing surface, such as a listing page hero. It is never allowed on repeated interactions: hover, press, toggles, modals, menus, lists, or navigation.
- A single easing curve applies everywhere: `cubic-bezier(0.23, 1, 0.32, 1)`.
- Continuous ambient drift loops, such as the CarRail auto row, are exempt from the 300ms and easing rules, which apply to transitions.
- This rule overrides any skill's timing guidance, including `impeccable/reference/animate.md`.

## Git

Never add attribution to commit messages or PR descriptions. No Co-Authored-By trailer, no 'Generated with Claude Code' line, no Claude-Session trailer and no claude.ai session links. Commit messages and PR bodies contain only the description of the change.

Keep PR descriptions short: a simple description of what the PR is about. No test plan section, no code snippets.

- Every new table, view or function in `public` must include explicit grants in its migration, because default privileges grant nothing to anon or authenticated. New functions must also `revoke execute ... from public, anon`, since PUBLIC execute cannot be removed by default privileges.
- Migrations:
  1. Write the migration file first, then apply exactly that file with `apply_migration`, and save it in the repo under the exact version live history records.
  2. Commit it in the same session.
  3. Never edit a migration after it is applied. Fix forward with a new one.
  4. Before opening a PR, compare `list_migrations` with `supabase/migrations` and report any mismatch.
- After any migration, regenerate `lib/supabase/database.types.ts` from the live project with `generate_typescript_types` and commit it in the same PR.

## Public data exposure

- Public showcase reads go through `public_cars_view`, `public_car_images_view` and `public_featured_cars_view`. All three are `security_invoker=true`.
- anon has column-level SELECT grants only on `cars` and `car_images`, plus RLS policies `anon_select_visible_cars` and `anon_select_visible_car_images` (TO anon only).
- Exposing a new column through a public view requires `grant select (<col>) on <table> to anon` in the same migration, or anon gets permission denied on that view.
- Never grant table-level SELECT to anon on `cars` or `car_images`, and never add visibility policies TO authenticated. authenticated holds table-level grants, so such a policy would expose `supplier_id`, `cost_price_ngn`, `vin`, `acquisition_notes`, `archive_reason` and `registration_plate` to any non-owner session.
- Visibility logic lives in `car_is_publicly_visible(p_status text)`. Change it there, not in individual views or policies.

## Output rules
- Never include model, effort or thinking-level recommendations in reports, plans or prompts. I set these myself.

## Image serving

- `car-images` is a private bucket. Nothing builds a `/storage/v1/object/...` URL for a car photo; use `getShowcaseImageUrl` or `getAdminImageUrl` from `lib/images.ts`.
- The public showcase serves photos from `/img/<path>` (`app/(public)/img`), which downloads with the anon client. The `car_images_anon_read_visible` policy on `storage.objects` decides visibility through `car_is_publicly_visible`; the route does no status checks of its own and returns one identical 404 for missing and not-visible photos.
- Admin screens serve photos from `/admin/img/<path>` on the owner's session (`car_images_owner_read`). Admin `<Image>` uses `unoptimized`, because the optimizer fetches without cookies and would cache private photos.
- External services (Anthropic in suggest-colours) get a 60-second signed URL minted with the owner session.
- The service role never touches an image read path. It is used only for deleting files in `removeCarImageFiles`.
- Photo paths are validated by `lib/carImagePath.ts` before any Storage lookup.
- A car that goes non-visible can still be served from caches for up to 15 minutes (`/img` `s-maxage=900`, `images.minimumCacheTTL: 900`). There is no on-demand purge.
