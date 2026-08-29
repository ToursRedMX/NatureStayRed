/*
# Expose nature_stay schema in Data API

1. Purpose
   - Add `nature_stay` to the list of schemas exposed by PostgREST (Supabase Data API).
   - This is a configuration-only change: NO tables, views, functions, triggers,
     RLS policies, grants, default privileges, or role definitions are modified.
   - The only change is setting the `pgrst.db_schemas` parameter on the
     `authenticator` role, which is the mechanism Supabase uses to configure
     which schemas PostgREST exposes.

2. What changes
   - `ALTER ROLE authenticator SET pgrst.db_schemas` to include `nature_stay`
     alongside the existing schemas (public, graphql_public, corporate).
   - `NOTIFY pgrst, 'reload config'` and `NOTIFY pgrst, 'reload schema'`
     to apply the change immediately.

3. What does NOT change
   - No tables, views, functions, triggers, or RLS policies are touched.
   - No grants are added, removed, or modified.
   - No default privileges are changed.
   - No roles are created or dropped.
   - No Storage, Auth, or Edge Function configuration is modified.
   - Block C grants and RLS remain exactly as defined in migrations C1-C8.
*/
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, corporate, nature_stay';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
