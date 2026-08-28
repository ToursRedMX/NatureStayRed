-- ============================================================================
-- Migration: C4 — nature_stay properties + properties_public view + PostGIS
-- Purpose: Create properties table, publication trigger, timezone trigger,
--          public view, column-level grants, RLS
-- Schema: nature_stay
-- Backwards-compatible: YES (new table + new view)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.properties
--   - View:  nature_stay.properties_public (security_invoker)
--   - Function: nature_stay.validate_property_publication()
--   - Trigger: trg_properties_updated_at
--   - Trigger: trg_properties_validate_timezone
--   - Trigger: trg_properties_validate_publication
--
-- Dependencies:
--   C1 (helpers: update_updated_at, validate_timezone)
--   C2a (property_types for FK)
--   C3 (host_profiles for FK)
--
-- RLS:
--   anon: SELECT public rows only (status=active, is_published=true,
--         archived_at IS NULL, verification_status=verified, host active)
--   authenticated owner: SELECT/INSERT/UPDATE own properties
--   super_admin: SELECT all
--   service_role: bypasses RLS
--
-- Column-level INSERT (authenticated):
--   host_id, property_type_id, name, slug, short_description, description,
--   country_code, state, city, municipality, address, postal_code,
--   coordinates, timezone, check_in_time, check_out_time,
--   instant_booking_enabled, pets_allowed, children_allowed, minimum_age,
--   smoking_allowed, parties_allowed, accessibility_info, house_rules, metadata
--
--   NOT insertable: id, status, verification_status, is_published,
--   published_at, archived_at, created_at, updated_at
--   is_published defaults to false. published_at defaults to NULL.
--   status defaults to 'draft'. verification_status defaults to 'unverified'.
--
-- Column-level UPDATE (authenticated):
--   property_type_id, name, slug, short_description, description,
--   country_code, state, city, municipality, address, postal_code,
--   coordinates, timezone, check_in_time, check_out_time,
--   is_published, instant_booking_enabled, pets_allowed, children_allowed,
--   minimum_age, smoking_allowed, parties_allowed, accessibility_info,
--   house_rules, metadata
--
--   NOT updateable: id, host_id, status, verification_status, published_at,
--   archived_at, created_at, updated_at
--   published_at is managed by the publication trigger, NOT by the host.
--
-- 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.properties
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.properties (
  id                      uuid                        NOT NULL DEFAULT gen_random_uuid(),
  host_id                 uuid                        NOT NULL,
  property_type_id        uuid                        NOT NULL,
  name                    text                        NOT NULL,
  slug                    text                        NOT NULL,
  short_description       text,
  description             text,
  country_code            text                        NOT NULL DEFAULT 'MX',
  state                   text,
  city                    text,
  municipality            text,
  address                 text,
  postal_code             text,
  coordinates             extensions.geography(Point, 4326),
  timezone                text                        NOT NULL DEFAULT 'America/Mexico_City',
  check_in_time           time,
  check_out_time          time,
  status                  text                        NOT NULL DEFAULT 'draft',
  verification_status     text                        NOT NULL DEFAULT 'unverified',
  is_published            boolean                     NOT NULL DEFAULT false,
  published_at            timestamptz,
  instant_booking_enabled boolean                     NOT NULL DEFAULT false,
  pets_allowed            boolean,
  children_allowed        boolean,
  minimum_age             integer,
  smoking_allowed         boolean,
  parties_allowed         boolean,
  accessibility_info      text,
  house_rules             text,
  metadata                jsonb                       NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz                 NOT NULL DEFAULT now(),
  updated_at              timestamptz                 NOT NULL DEFAULT now(),
  archived_at             timestamptz,

  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_slug_unique UNIQUE (slug),
  CONSTRAINT properties_status_check CHECK (status IN ('draft','pending_review','active','suspended','rejected','inactive')),
  CONSTRAINT properties_verification_check CHECK (verification_status IN ('unverified','pending','verified','rejected')),
  CONSTRAINT properties_publishing_consistency CHECK (
    is_published = false
    OR (is_published = true AND published_at IS NOT NULL)
  ),
  CONSTRAINT properties_name_nonempty CHECK (name <> ''),
  CONSTRAINT properties_slug_nonempty CHECK (slug <> ''),
  CONSTRAINT properties_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT properties_slug_reserved CHECK (
    slug NOT IN ('new','admin','account','settings','login','property','properties',
                 'host','hosts','booking','bookings','search','api','dashboard',
                 'profile','images','amenities','units','tours')
  ),
  CONSTRAINT properties_country_format CHECK (country_code ~ '^[A-Z]{2}$'),
  CONSTRAINT properties_minimum_age_check CHECK (minimum_age IS NULL OR minimum_age >= 0)
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_properties_host_id
  ON nature_stay.properties (host_id);

CREATE INDEX IF NOT EXISTS idx_properties_status_published_archived
  ON nature_stay.properties (status, is_published, archived_at);

CREATE INDEX IF NOT EXISTS idx_properties_property_type_id
  ON nature_stay.properties (property_type_id);

CREATE INDEX IF NOT EXISTS idx_properties_slug
  ON nature_stay.properties (slug);

CREATE INDEX IF NOT EXISTS idx_properties_coordinates
  ON nature_stay.properties USING GIST (coordinates);

-- ============================================================================
-- 3. Foreign keys
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_host_id_fkey'
      AND table_name = 'properties'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.properties
      ADD CONSTRAINT properties_host_id_fkey
      FOREIGN KEY (host_id) REFERENCES nature_stay.host_profiles(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'properties_property_type_id_fkey'
      AND table_name = 'properties'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.properties
      ADD CONSTRAINT properties_property_type_id_fkey
      FOREIGN KEY (property_type_id) REFERENCES nature_stay.property_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 4. RLS on properties
-- ============================================================================
ALTER TABLE nature_stay.properties ENABLE ROW LEVEL SECURITY;

-- SELECT: anon sees only public rows
DROP POLICY IF EXISTS "properties_select_anon" ON nature_stay.properties;
CREATE POLICY "properties_select_anon"
ON nature_stay.properties FOR SELECT
TO anon
USING (
  status = 'active'
  AND is_published = true
  AND archived_at IS NULL
  AND verification_status = 'verified'
  AND EXISTS (
    SELECT 1 FROM nature_stay.host_profiles hp
    WHERE hp.id = properties.host_id
      AND hp.is_active = true
      AND hp.onboarding_status = 'active'
      AND hp.archived_at IS NULL
  )
);

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "properties_select_owner" ON nature_stay.properties;
CREATE POLICY "properties_select_owner"
ON nature_stay.properties FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_profiles hp
    WHERE hp.id = properties.host_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "properties_select_super_admin" ON nature_stay.properties;
CREATE POLICY "properties_select_super_admin"
ON nature_stay.properties FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: host with active operational status
DROP POLICY IF EXISTS "properties_insert_owner" ON nature_stay.properties;
CREATE POLICY "properties_insert_owner"
ON nature_stay.properties FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('host', 'naturestayred')
  AND host_id IN (
    SELECT id FROM nature_stay.host_profiles
    WHERE user_id = auth.uid()
      AND is_active = true
      AND onboarding_status = 'active'
      AND archived_at IS NULL
  )
);

-- UPDATE: owner (column-level grants restrict which columns)
DROP POLICY IF EXISTS "properties_update_owner" ON nature_stay.properties;
CREATE POLICY "properties_update_owner"
ON nature_stay.properties FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_profiles hp
    WHERE hp.id = properties.host_id
      AND hp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_profiles hp
    WHERE hp.id = properties.host_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. Column-level grants on properties
-- ============================================================================

-- anon: SELECT only public columns + filter columns needed by the view WHERE
GRANT SELECT (
  id, host_id, property_type_id, name, slug, short_description, description,
  country_code, state, city, municipality, timezone, check_in_time,
  check_out_time, instant_booking_enabled, pets_allowed, children_allowed,
  minimum_age, smoking_allowed, parties_allowed, accessibility_info,
  house_rules, created_at, updated_at,
  status, is_published, archived_at, verification_status
) ON nature_stay.properties TO anon;

-- authenticated: SELECT all
GRANT SELECT ON nature_stay.properties TO authenticated;

-- authenticated: INSERT only allowed columns
GRANT INSERT (
  host_id, property_type_id, name, slug, short_description, description,
  country_code, state, city, municipality, address, postal_code,
  coordinates, timezone, check_in_time, check_out_time,
  instant_booking_enabled, pets_allowed, children_allowed, minimum_age,
  smoking_allowed, parties_allowed, accessibility_info, house_rules, metadata
) ON nature_stay.properties TO authenticated;

-- authenticated: UPDATE only allowed columns
-- published_at is NOT here — managed by trigger
-- status, verification_status, archived_at NOT here — admin-controlled
GRANT UPDATE (
  property_type_id, name, slug, short_description, description,
  country_code, state, city, municipality, address, postal_code,
  coordinates, timezone, check_in_time, check_out_time,
  is_published, instant_booking_enabled, pets_allowed, children_allowed,
  minimum_age, smoking_allowed, parties_allowed, accessibility_info,
  house_rules, metadata
) ON nature_stay.properties TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.properties TO service_role;

-- ============================================================================
-- 6. View: nature_stay.properties_public (security_invoker)
-- ============================================================================
-- Exposes only marketplace columns. Does NOT expose:
--   address, postal_code, coordinates, metadata, status, is_published,
--   published_at, archived_at, verification_status

CREATE OR REPLACE VIEW nature_stay.properties_public
WITH (security_invoker = true) AS
SELECT
  id,
  host_id,
  property_type_id,
  name,
  slug,
  short_description,
  description,
  country_code,
  state,
  city,
  municipality,
  timezone,
  check_in_time,
  check_out_time,
  instant_booking_enabled,
  pets_allowed,
  children_allowed,
  minimum_age,
  smoking_allowed,
  parties_allowed,
  accessibility_info,
  house_rules,
  created_at,
  updated_at
FROM nature_stay.properties
WHERE status = 'active'
  AND is_published = true
  AND archived_at IS NULL
  AND verification_status = 'verified'
  AND EXISTS (
    SELECT 1 FROM nature_stay.host_profiles hp
    WHERE hp.id = properties.host_id
      AND hp.is_active = true
      AND hp.onboarding_status = 'active'
      AND hp.archived_at IS NULL
  );

GRANT SELECT ON nature_stay.properties_public TO anon, authenticated;

-- ============================================================================
-- 7. Function: nature_stay.validate_property_publication()
-- Purpose: BEFORE INSERT OR UPDATE OF is_published trigger
--          Validates that property + host meet publication conditions.
--          Auto-sets published_at = now() on first publication.
-- Security: SECURITY INVOKER, search_path = nature_stay, pg_temp
-- ============================================================================

CREATE OR REPLACE FUNCTION nature_stay.validate_property_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nature_stay, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true THEN
    -- Property conditions
    IF NEW.status <> 'active' THEN
      RAISE EXCEPTION 'Cannot publish property %: status must be active.', NEW.id;
    END IF;
    IF NEW.verification_status <> 'verified' THEN
      RAISE EXCEPTION 'Cannot publish property %: verification_status must be verified.', NEW.id;
    END IF;
    IF NEW.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot publish property %: property is archived.', NEW.id;
    END IF;

    -- Host conditions
    IF NOT EXISTS (
      SELECT 1 FROM nature_stay.host_profiles hp
      WHERE hp.id = NEW.host_id
        AND hp.is_active = true
        AND hp.onboarding_status = 'active'
        AND hp.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot publish property %: host is not active or not in active onboarding state.', NEW.id;
    END IF;

    -- Auto-set published_at on first publication
    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nature_stay.validate_property_publication() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nature_stay.validate_property_publication() TO authenticated, service_role;

-- ============================================================================
-- 8. Triggers on properties
-- ============================================================================

-- updated_at
DROP TRIGGER IF EXISTS trg_properties_updated_at ON nature_stay.properties;
CREATE TRIGGER trg_properties_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.properties
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();

-- timezone validation
DROP TRIGGER IF EXISTS trg_properties_validate_timezone ON nature_stay.properties;
CREATE TRIGGER trg_properties_validate_timezone
  BEFORE INSERT OR UPDATE OF timezone ON nature_stay.properties
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.validate_timezone();

-- publication validation
DROP TRIGGER IF EXISTS trg_properties_validate_publication ON nature_stay.properties;
CREATE TRIGGER trg_properties_validate_publication
  BEFORE INSERT OR UPDATE OF is_published ON nature_stay.properties
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.validate_property_publication();
