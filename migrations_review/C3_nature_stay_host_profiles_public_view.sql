-- ============================================================================
-- Migration: C3 — nature_stay host model (split: profiles, accounts, private)
-- Purpose: Create host_profiles (public-safe), host_accounts (ownership/operational),
--          host_private_details (private data), public + owner views
-- Schema: nature_stay
-- Backwards-compatible: YES (new tables + new views)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.host_profiles (public-safe identity)
--   - Table: nature_stay.host_accounts (ownership + operational state)
--   - Table: nature_stay.host_private_details (fiscal/private data)
--   - View:  nature_stay.host_public_info (security_barrier)
--   - View:  nature_stay.host_profile_owner_view (security_invoker)
--   - Trigger: trg_host_profiles_updated_at
--   - Trigger: trg_host_accounts_updated_at
--   - Trigger: trg_host_private_details_updated_at
--
-- Dependencies:
--   C1 (helpers: update_updated_at)
--   003 (public.has_role for super_admin policies)
--   public.users (FK for host_accounts.user_id)
--
-- ARCHITECTURE — Physical Split (Option A):
--   host_profiles: public-safe columns only. No user_id, no admin fields.
--   host_accounts: ownership (user_id) + operational state (verification,
--     onboarding, is_active, archived_at). Owner/admin only.
--   host_private_details: fiscal/private data (RFC, phone, address, coordinates).
--     Owner/admin only.
--
--   Marketplace reads: host_public_info (security_barrier view).
--     Bypasses RLS as postgres. WHERE filters host operational state.
--     Only returns public-safe columns.
--   Owner reads: host_profile_owner_view (security_invoker view).
--     RLS on underlying tables ensures owner sees only own data.
--
--   Host creation is BACKEND-ONLY (service_role).
--   authenticated has NO INSERT on host_profiles or host_accounts.
--   authenticated owner can UPDATE public-safe columns on host_profiles.
--   authenticated owner can INSERT/UPDATE host_private_details.
--
-- Ownership path:
--   auth.uid() → host_accounts.user_id → host_accounts.host_id → host_profiles.id
--
-- 0 SECURITY DEFINER.
-- All functions: SECURITY INVOKER + explicit search_path.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.host_profiles (public-safe)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.host_profiles (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
  display_name          text          NOT NULL,
  description           text,
  profile_image_path    text,
  cover_image_path      text,
  country_code          text          NOT NULL DEFAULT 'MX',
  city                  text,
  state                 text,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT host_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT host_profiles_display_name_nonempty CHECK (display_name <> ''),
  CONSTRAINT host_profiles_country_format CHECK (country_code ~ '^[A-Z]{2}$')
);

-- No idx_host_profiles_user_id — user_id is NOT in this table.
-- No idx_host_profiles_coordinates — coordinates moved to host_private_details.
-- No idx_host_profiles_verification_onboarding — those columns moved to host_accounts.

-- ============================================================================
-- 2. Table: nature_stay.host_accounts (ownership + operational state)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.host_accounts (
  host_id               uuid          NOT NULL,
  user_id               uuid          NOT NULL,
  host_type             text          NOT NULL DEFAULT 'individual',
  verification_status   text          NOT NULL DEFAULT 'unverified',
  onboarding_status     text          NOT NULL DEFAULT 'draft',
  is_active             boolean       NOT NULL DEFAULT true,
  archived_at           timestamptz,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT host_accounts_pkey PRIMARY KEY (host_id),
  CONSTRAINT host_accounts_user_unique UNIQUE (user_id),
  CONSTRAINT host_accounts_host_type_check CHECK (host_type IN ('individual','company')),
  CONSTRAINT host_accounts_verification_check CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  CONSTRAINT host_accounts_onboarding_check CHECK (onboarding_status IN ('draft','pending_review','active','suspended','rejected','inactive'))
);

-- No idx_host_accounts_user_id — UNIQUE(user_id) already creates a B-tree index.

CREATE INDEX IF NOT EXISTS idx_host_accounts_verification_onboarding
  ON nature_stay.host_accounts (verification_status, onboarding_status);

-- ============================================================================
-- 3. Table: nature_stay.host_private_details (fiscal/private data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.host_private_details (
  host_id               uuid                        NOT NULL,
  legal_name            text,
  phone                 text,
  contact_email         text,
  website               text,
  rfc                   text,
  razon_social          text,
  regimen_fiscal        text,
  address               text,
  postal_code           text,
  coordinates           extensions.geography(Point, 4326),
  metadata              jsonb                       NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz                 NOT NULL DEFAULT now(),
  updated_at            timestamptz                 NOT NULL DEFAULT now(),

  CONSTRAINT host_private_details_pkey PRIMARY KEY (host_id),
  CONSTRAINT host_private_details_regimen_check CHECK (
    regimen_fiscal IS NULL OR regimen_fiscal IN (
      'Persona Fisica','Persona Moral','Resico','Sin Obligaciones'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_host_private_details_coordinates
  ON nature_stay.host_private_details USING GIST (coordinates);

-- ============================================================================
-- 4. Foreign keys
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'host_accounts_host_id_fkey'
      AND table_name = 'host_accounts'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.host_accounts
      ADD CONSTRAINT host_accounts_host_id_fkey
      FOREIGN KEY (host_id) REFERENCES nature_stay.host_profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'host_accounts_user_id_fkey'
      AND table_name = 'host_accounts'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.host_accounts
      ADD CONSTRAINT host_accounts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'host_private_details_host_id_fkey'
      AND table_name = 'host_private_details'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.host_private_details
      ADD CONSTRAINT host_private_details_host_id_fkey
      FOREIGN KEY (host_id) REFERENCES nature_stay.host_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 5. RLS on host_profiles
-- ============================================================================
ALTER TABLE nature_stay.host_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated owner (via host_accounts ownership path)
DROP POLICY IF EXISTS "host_profiles_select_owner" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_select_owner"
ON nature_stay.host_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_profiles.id
      AND ha.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "host_profiles_select_super_admin" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_select_super_admin"
ON nature_stay.host_profiles FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- UPDATE: owner (column-level grants restrict which columns)
DROP POLICY IF EXISTS "host_profiles_update_owner" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_update_owner"
ON nature_stay.host_profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_profiles.id
      AND ha.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_profiles.id
      AND ha.user_id = auth.uid()
  )
);

-- No INSERT policy for authenticated — host creation is backend-only.
-- No DELETE policy for authenticated.
-- No SELECT policy for anon — marketplace reads use host_public_info view.

-- ============================================================================
-- 6. RLS on host_accounts
-- ============================================================================
ALTER TABLE nature_stay.host_accounts ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "host_accounts_select_owner" ON nature_stay.host_accounts;
CREATE POLICY "host_accounts_select_owner"
ON nature_stay.host_accounts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: super_admin
DROP POLICY IF EXISTS "host_accounts_select_super_admin" ON nature_stay.host_accounts;
CREATE POLICY "host_accounts_select_super_admin"
ON nature_stay.host_accounts FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- No INSERT/UPDATE/DELETE policies for authenticated.
-- All operational state changes are backend/service_role only.

-- ============================================================================
-- 7. RLS on host_private_details
-- ============================================================================
ALTER TABLE nature_stay.host_private_details ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "host_private_details_select_owner" ON nature_stay.host_private_details;
CREATE POLICY "host_private_details_select_owner"
ON nature_stay.host_private_details FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_private_details.host_id
      AND ha.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "host_private_details_select_super_admin" ON nature_stay.host_private_details;
CREATE POLICY "host_private_details_select_super_admin"
ON nature_stay.host_private_details FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner (if private details row does not exist yet)
DROP POLICY IF EXISTS "host_private_details_insert_owner" ON nature_stay.host_private_details;
CREATE POLICY "host_private_details_insert_owner"
ON nature_stay.host_private_details FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_private_details.host_id
      AND ha.user_id = auth.uid()
  )
);

-- UPDATE: owner
DROP POLICY IF EXISTS "host_private_details_update_owner" ON nature_stay.host_private_details;
CREATE POLICY "host_private_details_update_owner"
ON nature_stay.host_private_details FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_private_details.host_id
      AND ha.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    WHERE ha.host_id = host_private_details.host_id
      AND ha.user_id = auth.uid()
  )
);

-- No DELETE policy for authenticated.

-- ============================================================================
-- 8. Grants on host_profiles
-- ============================================================================

-- anon: NO grants on base table. Marketplace reads use host_public_info view.
-- authenticated: SELECT + UPDATE (public-safe columns only)
GRANT SELECT ON nature_stay.host_profiles TO authenticated;
GRANT UPDATE (
  display_name, description, profile_image_path, cover_image_path,
  country_code, city, state
) ON nature_stay.host_profiles TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.host_profiles TO service_role;

-- ============================================================================
-- 9. Grants on host_accounts
-- ============================================================================

-- anon: NO grants.
-- authenticated: SELECT only (no INSERT/UPDATE/DELETE)
GRANT SELECT ON nature_stay.host_accounts TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.host_accounts TO service_role;

-- ============================================================================
-- 10. Grants on host_private_details
-- ============================================================================

-- anon: NO grants.
-- authenticated: SELECT, INSERT, UPDATE (no DELETE)
GRANT SELECT, INSERT, UPDATE ON nature_stay.host_private_details TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.host_private_details TO service_role;

-- ============================================================================
-- 11. View: nature_stay.host_public_info (security_barrier)
-- ============================================================================
-- Public marketplace view for host information.
-- security_barrier = true: view executes as postgres (bypasses RLS).
-- This is a DELIBERATE trust boundary:
--   1. Column list is explicit — only public-safe columns
--   2. WHERE filters to operational hosts only
--   3. security_barrier prevents subquery inference attacks
--   4. host_accounts columns are NOT exposed in the SELECT list
-- anon does NOT need grants on host_accounts for this view to work.

CREATE OR REPLACE VIEW nature_stay.host_public_info
WITH (security_barrier = true) AS
SELECT
  hp.id,
  hp.display_name,
  hp.description,
  hp.profile_image_path,
  hp.cover_image_path,
  hp.country_code,
  hp.city,
  hp.state,
  hp.created_at
FROM nature_stay.host_profiles hp
WHERE EXISTS (
  SELECT 1 FROM nature_stay.host_accounts ha
  WHERE ha.host_id = hp.id
    AND ha.is_active = true
    AND ha.onboarding_status = 'active'
    AND ha.archived_at IS NULL
);

REVOKE ALL ON nature_stay.host_public_info FROM PUBLIC;
GRANT SELECT ON nature_stay.host_public_info TO anon, authenticated;

-- ============================================================================
-- 12. View: nature_stay.host_profile_owner_view (security_invoker)
-- ============================================================================
-- Owner view: joins host_profiles + host_accounts + host_private_details.
-- security_invoker = true: RLS on underlying tables applies to the querying user.
-- Owner sees only their own row (RLS on host_accounts filters by user_id).

CREATE OR REPLACE VIEW nature_stay.host_profile_owner_view
WITH (security_invoker = true) AS
SELECT
  hp.id,
  hp.display_name,
  hp.description,
  hp.profile_image_path,
  hp.cover_image_path,
  hp.country_code,
  hp.city,
  hp.state,
  hp.created_at,
  hp.updated_at,
  ha.host_type,
  ha.verification_status,
  ha.onboarding_status,
  ha.is_active,
  ha.archived_at,
  hpd.legal_name,
  hpd.phone,
  hpd.contact_email,
  hpd.website,
  hpd.rfc,
  hpd.razon_social,
  hpd.regimen_fiscal,
  hpd.address,
  hpd.postal_code,
  hpd.coordinates,
  hpd.metadata
FROM nature_stay.host_profiles hp
JOIN nature_stay.host_accounts ha ON ha.host_id = hp.id
LEFT JOIN nature_stay.host_private_details hpd ON hpd.host_id = hp.id
WHERE ha.user_id = auth.uid();

REVOKE ALL ON nature_stay.host_profile_owner_view FROM PUBLIC;
GRANT SELECT ON nature_stay.host_profile_owner_view TO authenticated;

-- ============================================================================
-- 13. Triggers
-- ============================================================================

-- host_profiles updated_at
DROP TRIGGER IF EXISTS trg_host_profiles_updated_at ON nature_stay.host_profiles;
CREATE TRIGGER trg_host_profiles_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.host_profiles
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();

-- host_accounts updated_at
DROP TRIGGER IF EXISTS trg_host_accounts_updated_at ON nature_stay.host_accounts;
CREATE TRIGGER trg_host_accounts_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.host_accounts
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();

-- host_private_details updated_at
DROP TRIGGER IF EXISTS trg_host_private_details_updated_at ON nature_stay.host_private_details;
CREATE TRIGGER trg_host_private_details_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.host_private_details
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();
