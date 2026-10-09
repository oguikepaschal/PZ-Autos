# Migrations

Applied migrations are never edited (see CLAUDE.md). Fix forward with a new
migration instead. The PR workflow in `.github/workflows/migrations.yml`
enforces this for `.sql` files.

## Known drift in three baseline files

These files gained `set search_path = public, pg_temp` lines after they were
applied, so they differ from the statements production recorded for them:

- `20260902143927_baseline_schema.sql`
- `20260902143945_public_views.sql`
- `20260902144017_rpc_functions.sql`

Production already has `search_path=public, pg_temp` set on those functions,
so the live schema matches the files. They are intentionally left as they are
under the never-edit-after-apply rule.
