-- ============================================================================
-- Migration: C3 — nature_stay host_profiles + host_public_info view
-- Purpose: Create host_profiles table, column-level grants, RLS, public view
-- Schema: nature_stay
-- Backwards-compatible: YES (new table + new view)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.host_profiles
--   - View:  nature_stay.host_public_info (security_invoker)
--   - Trigger: trg_host_profiles_updated_at
--
-- RLS:
--   anon: SELECT public rows only (is_active=true, onboarding_status='active',
--         archived_at IS NULL), limited to public columns via column-level grants
--   authenticated owner: SELECT/INSERT/UPDATE own row
--   authenticated non-owner: no access (unless super_admin)
--   super_admin: SELECT all rows
--   service_role: bypasses RLS
--
-- Column-level INSERT (authenticated):
--   user_id, host_type, display_name, legal_name, description, phone,
--   contact_email, website, profile_image_path, cover_image_path, rfc,
--   razon_social, regimen_fiscal, country_code, address, city, state,
--   postal_code, coordinates, metadata
--
-- Column-level UPDATE (authenticated):
--   display_name, legal_name, description, phone, contact_email, website,
--   profile_image_path, cover_image_path, rfc, razon_social, regimen_fiscal,
--   country_code, address, city, state, postal_code, coordinates, metadata
--
--   NOTE: host_type is INSERTable but NOT UPDATEable.
--   NOTE: verification_status, onboarding_status, is_active, archived_at
--         are NOT insertable and NOT updateable by authenticated.
--         These are admin-controlled fields modified only via
--         backend/service_role.
--
-- 0 timezone triggers. 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.host_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.host_profiles (
  id                    uuid                        NOT NULL DEFAULT gen_random_uuid(),
  user_id               uuid                        NOT NULL,
  host_type             text                        NOT NULL DEFAULT 'individual',
  display_name          text                        NOT NULL,
  legal_name            text,
  description           text,
  phone                 text,
  contact_email         text,
  website               text,
  profile_image_path    text,
  cover_image_path      text,
  rfc                   text,
  razon_social          text,
  regimen_fiscal        text,
  country_code          text                        NOT NULL DEFAULT 'MX',
  address               text,
  city                  text,
  state                 text,
  postal_code           text,
  coordinates           extensions.geography(Point, 4326),
  verification_status   text                        NOT NULL DEFAULT 'unverified',
  onboarding_status     text                        NOT NULL DEFAULT 'draft',
  is_active             boolean                     NOT NULL DEFAULT true,
  metadata              jsonb                       NOT NULL DEFAULT '{}'::jsonb,
  created_at            timestamptz                 NOT NULL DEFAULT now(),
  updated_at            timestamptz                 NOT NULL DEFAULT now(),
  archived_at           timestamptz,

  CONSTRAINT host_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT host_profiles_user_unique UNIQUE (user_id),
  CONSTRAINT host_profiles_host_type_check CHECK (host_type IN ('individual','company')),
  CONSTRAINT host_profiles_verification_check CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  CONSTRAINT host_profiles_onboarding_check CHECK (onboarding_status IN ('draft','pending_review','active','suspended','rejected','inactive')),
  CONSTRAINT host_profiles_display_name_nonempty CHECK (display_name <> ''),
  CONSTRAINT host_profiles_country_format CHECK (country_code ~ '^[A-Z]{2}$')
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id
  ON nature_stay.host_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_host_profiles_verification_onboarding
  ON nature_stay.host_profiles (verification_status, onboarding_status);

CREATE INDEX IF NOT EXISTS idx_host_profiles_coordinates
  ON nature_stay.host_profiles USING GIST (coordinates);

-- ============================================================================
-- 3. Foreign key
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'host_profiles_user_id_fkey'
      AND table_name = 'host_profiles'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.host_profiles
      ADD CONSTRAINT host_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 4. RLS on host_profiles
-- ============================================================================
ALTER TABLE nature_stay.host_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: anon sees only public rows
DROP POLICY IF EXISTS "host_profiles_select_anon" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_select_anon"
ON nature_stay.host_profiles FOR SELECT
TO anon
USING (
  is_active = true
  AND onboarding_status = 'active'
  AND archived_at IS NULL
);

-- SELECT: authenticated owner sees own row
DROP POLICY IF EXISTS "host_profiles_select_owner" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_select_owner"
ON nature_stay.host_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- SELECT: super_admin sees all rows
DROP POLICY IF EXISTS "host_profiles_select_super_admin" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_select_super_admin"
ON nature_stay.host_profiles FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner with host role
DROP POLICY IF EXISTS "host_profiles_insert_owner" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_insert_owner"
ON nature_stay.host_profiles FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND public.has_role('host', 'naturestayred')
);

-- UPDATE: owner (column-level grants restrict which columns)
DROP POLICY IF EXISTS "host_profiles_update_owner" ON nature_stay.host_profiles;
CREATE POLICY "host_profiles_update_owner"
ON nature_stay.host_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 5. Column-level grants on host_profiles
-- ============================================================================

-- anon: SELECT only public columns + filter columns
GRANT SELECT (
  id, display_name, description, profile_image_path, cover_image_path,
  is_active, onboarding_status, archived_at
) ON nature_stay.host_profiles TO anon;

-- authenticated: SELECT all columns
GRANT SELECT ON nature_stay.host_profiles TO authenticated;

-- authenticated: INSERT only allowed columns (NOT admin fields)
GRANT INSERT (
  user_id, host_type, display_name, legal_name, description, phone,
  contact_email, website, profile_image_path, cover_image_path, rfc,
  razon_social, regimen_fiscal, country_code, address, city, state,
  postal_code, coordinates, metadata
) ON nature_stay.host_profiles TO authenticated;

-- authenticated: UPDATE only allowed columns
-- host_type is NOT here — it is insert-only, not updateable
-- verification_status, onboarding_status, is_active, archived_at NOT here
GRANT UPDATE (
  display_name, legal_name, description, phone, contact_email, website,
  profile_image_path, cover_image_path, rfc, razon_social, regimen_fiscal,
  country_code, address, city, state, postal_code, coordinates, metadata
) ON nature_stay.host_profiles TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.host_profiles TO service_role;

-- ============================================================================
-- 6. View: nature_stay.host_public_info (security_invoker)
-- ============================================================================
-- Exposes only public columns. Filters to active, onboarded, non-archived hosts.
-- security_invoker = true means RLS of the underlying table is applied to
-- the querying user. anon has column-level SELECT on the columns used here
-- plus RLS that only returns public rows.

CREATE OR REPLACE VIEW nature_stay.host_public_info
WITH (security_invoker = true) AS
SELECT
  id,
  display_name,
  description,
  profile_image_path,
  cover_image_path
FROM nature_stay.host_profiles
WHERE is_active = true
  AND onboarding_status = 'active'
  AND archived_at IS NULL;

GRANT SELECT ON nature_stay.host_public_info TO anon, authenticated;

-- ============================================================================
-- 7. Trigger: trg_host_profiles_updated_at
-- ============================================================================
CREATE TRIGGER trg_host_profiles_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.host_profiles
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();
