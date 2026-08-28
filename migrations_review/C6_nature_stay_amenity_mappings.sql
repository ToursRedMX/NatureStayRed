-- ============================================================================
-- Migration: C6 — nature_stay amenity mappings
-- Purpose: Create property_amenities and unit_amenities mapping tables
-- Schema: nature_stay
-- Backwards-compatible: YES (new tables)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.property_amenities
--   - Table: nature_stay.unit_amenities
--
-- Dependencies:
--   C4 (properties for FK)
--   C5 (units for FK)
--   C2a (amenities for FK)
--
-- RLS:
--   anon: SELECT only if parent is publicly visible
--   authenticated owner: SELECT, INSERT, DELETE own mappings
--   super_admin: SELECT all
--   service_role: bypasses RLS
--
-- 0 functions. 0 triggers. 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.property_amenities
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.property_amenities (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  property_id   uuid          NOT NULL,
  amenity_id    uuid          NOT NULL,

  CONSTRAINT property_amenities_pkey PRIMARY KEY (id),
  CONSTRAINT property_amenities_pair_unique UNIQUE (property_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_property_amenities_property_id
  ON nature_stay.property_amenities (property_id);

CREATE INDEX IF NOT EXISTS idx_property_amenities_amenity_id
  ON nature_stay.property_amenities (amenity_id);

-- ============================================================================
-- 2. Table: nature_stay.unit_amenities
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.unit_amenities (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  unit_id       uuid          NOT NULL,
  amenity_id    uuid          NOT NULL,

  CONSTRAINT unit_amenities_pkey PRIMARY KEY (id),
  CONSTRAINT unit_amenities_pair_unique UNIQUE (unit_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_unit_amenities_unit_id
  ON nature_stay.unit_amenities (unit_id);

CREATE INDEX IF NOT EXISTS idx_unit_amenities_amenity_id
  ON nature_stay.unit_amenities (amenity_id);

-- ============================================================================
-- 3. Foreign keys
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_amenities_property_id_fkey'
      AND table_name = 'property_amenities'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.property_amenities
      ADD CONSTRAINT property_amenities_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES nature_stay.properties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_amenities_amenity_id_fkey'
      AND table_name = 'property_amenities'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.property_amenities
      ADD CONSTRAINT property_amenities_amenity_id_fkey
      FOREIGN KEY (amenity_id) REFERENCES nature_stay.amenities(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_amenities_unit_id_fkey'
      AND table_name = 'unit_amenities'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.unit_amenities
      ADD CONSTRAINT unit_amenities_unit_id_fkey
      FOREIGN KEY (unit_id) REFERENCES nature_stay.units(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_amenities_amenity_id_fkey'
      AND table_name = 'unit_amenities'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.unit_amenities
      ADD CONSTRAINT unit_amenities_amenity_id_fkey
      FOREIGN KEY (amenity_id) REFERENCES nature_stay.amenities(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 4. RLS on property_amenities
-- ============================================================================
ALTER TABLE nature_stay.property_amenities ENABLE ROW LEVEL SECURITY;

-- SELECT: anon via parent property publicly visible
DROP POLICY IF EXISTS "property_amenities_select_anon" ON nature_stay.property_amenities;
CREATE POLICY "property_amenities_select_anon"
ON nature_stay.property_amenities FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    WHERE p.id = property_amenities.property_id
      AND p.status = 'active'
      AND p.is_published = true
      AND p.archived_at IS NULL
      AND p.verification_status = 'verified'
      AND EXISTS (
        SELECT 1 FROM nature_stay.host_profiles hp
        WHERE hp.id = p.host_id
          AND hp.is_active = true
          AND hp.onboarding_status = 'active'
          AND hp.archived_at IS NULL
      )
  )
);

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "property_amenities_select_owner" ON nature_stay.property_amenities;
CREATE POLICY "property_amenities_select_owner"
ON nature_stay.property_amenities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_amenities.property_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "property_amenities_select_super_admin" ON nature_stay.property_amenities;
CREATE POLICY "property_amenities_select_super_admin"
ON nature_stay.property_amenities FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner
DROP POLICY IF EXISTS "property_amenities_insert_owner" ON nature_stay.property_amenities;
CREATE POLICY "property_amenities_insert_owner"
ON nature_stay.property_amenities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_amenities.property_id
      AND hp.user_id = auth.uid()
  )
);

-- DELETE: owner
DROP POLICY IF EXISTS "property_amenities_delete_owner" ON nature_stay.property_amenities;
CREATE POLICY "property_amenities_delete_owner"
ON nature_stay.property_amenities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_amenities.property_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. RLS on unit_amenities
-- ============================================================================
ALTER TABLE nature_stay.unit_amenities ENABLE ROW LEVEL SECURITY;

-- SELECT: anon via parent unit/property publicly visible
DROP POLICY IF EXISTS "unit_amenities_select_anon" ON nature_stay.unit_amenities;
CREATE POLICY "unit_amenities_select_anon"
ON nature_stay.unit_amenities FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    WHERE u.id = unit_amenities.unit_id
      AND u.status = 'active'
      AND u.is_published = true
      AND u.archived_at IS NULL
      AND p.status = 'active'
      AND p.is_published = true
      AND p.archived_at IS NULL
      AND p.verification_status = 'verified'
      AND EXISTS (
        SELECT 1 FROM nature_stay.host_profiles hp
        WHERE hp.id = p.host_id
          AND hp.is_active = true
          AND hp.onboarding_status = 'active'
          AND hp.archived_at IS NULL
      )
  )
);

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "unit_amenities_select_owner" ON nature_stay.unit_amenities;
CREATE POLICY "unit_amenities_select_owner"
ON nature_stay.unit_amenities FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_amenities.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "unit_amenities_select_super_admin" ON nature_stay.unit_amenities;
CREATE POLICY "unit_amenities_select_super_admin"
ON nature_stay.unit_amenities FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner
DROP POLICY IF EXISTS "unit_amenities_insert_owner" ON nature_stay.unit_amenities;
CREATE POLICY "unit_amenities_insert_owner"
ON nature_stay.unit_amenities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_amenities.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- DELETE: owner
DROP POLICY IF EXISTS "unit_amenities_delete_owner" ON nature_stay.unit_amenities;
CREATE POLICY "unit_amenities_delete_owner"
ON nature_stay.unit_amenities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_amenities.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. Grants on mapping tables
-- ============================================================================
GRANT SELECT ON nature_stay.property_amenities TO anon, authenticated;
GRANT SELECT ON nature_stay.unit_amenities TO anon, authenticated;

GRANT SELECT, INSERT, DELETE ON nature_stay.property_amenities TO authenticated;
GRANT SELECT, INSERT, DELETE ON nature_stay.unit_amenities TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.property_amenities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.unit_amenities TO service_role;
