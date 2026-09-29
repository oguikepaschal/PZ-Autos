-- New objects created by postgres in public no longer inherit access for
-- anon or authenticated. Every new table, view or function must carry its
-- own explicit grants. Existing objects and service_role defaults are
-- unchanged.
--
-- Schema-scoped default ACLs cannot remove Postgres's built-in PUBLIC
-- execute on new functions, so a new function migration must also
-- revoke execute from public and anon itself.

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
