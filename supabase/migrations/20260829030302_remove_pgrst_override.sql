/*
# Remove manual pgrst.db_schemas override from authenticator role

1. Purpose
   - The Supabase Dashboard now manages `nature_stay` in the Exposed Schemas list
     (Project Settings → Data API → Exposed Schemas).
   - The manual `ALTER ROLE authenticator SET pgrst.db_schemas` override is no longer
     needed and should be removed so the Dashboard configuration is the single source of truth.

2. What changes
   - `ALTER ROLE authenticator RESET pgrst.db_schemas` — removes the manual override.
   - `NOTIFY pgrst, 'reload config'` and `NOTIFY pgrst, 'reload schema'` — applies immediately.

3. What does NOT change
   - No tables, views, functions, triggers, RLS policies, grants, default privileges, or roles.
   - Other authenticator settings (statement_timeout, lock_timeout, session_preload_libraries) remain intact.
   - The Dashboard-managed Exposed Schemas list (public, graphql_public, corporate, nature_stay) is now authoritative.
*/
ALTER ROLE authenticator RESET pgrst.db_schemas;
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
