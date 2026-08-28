-- ============================================================================
-- Migration: C7 — nature_stay image metadata
-- Purpose: Create property_images and unit_images metadata tables
-- Schema: nature_stay
-- Backwards-compatible: YES (new tables)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.property_images
--   - Table: nature_stay.unit_images
--
-- Dependencies:
--   C4 (properties for FK)
--   C5 (units for FK)
--
-- RLS:
--   anon: SELECT only if parent is publicly visible
--   authenticated owner: SELECT, INSERT, UPDATE, DELETE own images
--   super_admin: SELECT all
--   service_role: bypasses RLS
--
-- Constraints:
--   UNIQUE(storage_path)
--   Partial UNIQUE (property_id/unit_id) WHERE is_cover = true
--   sort_order >= 0, width > 0, height > 0, file_size > 0
--
-- No Storage buckets created in this migration.
--
-- 0 functions. 0 triggers. 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.property_images
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.property_images (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  property_id   uuid          NOT NULL,
  storage_path  text          NOT NULL,
  alt_text      text,
  caption       text,
  sort_order    integer       NOT NULL DEFAULT 0,
  is_cover      boolean       NOT NULL DEFAULT false,
  width         integer,
  height        integer,
  file_size     bigint,
  mime_type     text,
  created_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT property_images_pkey PRIMARY KEY (id),
  CONSTRAINT property_images_storage_path_unique UNIQUE (storage_path),
  CONSTRAINT property_images_sort_order_check CHECK (sort_order >= 0),
  CONSTRAINT property_images_width_check CHECK (width IS NULL OR width > 0),
  CONSTRAINT property_images_height_check CHECK (height IS NULL OR height > 0),
  CONSTRAINT property_images_file_size_check CHECK (file_size IS NULL OR file_size > 0)
);

-- Partial UNIQUE: max one cover per property
CREATE UNIQUE INDEX IF NOT EXISTS idx_property_images_cover
  ON nature_stay.property_images (property_id)
  WHERE is_cover = true;

CREATE INDEX IF NOT EXISTS idx_property_images_property_sort
  ON nature_stay.property_images (property_id, sort_order);

-- ============================================================================
-- 2. Table: nature_stay.unit_images
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.unit_images (
  id            uuid          NOT NULL DEFAULT gen_random_uuid(),
  unit_id       uuid          NOT NULL,
  storage_path  text          NOT NULL,
  alt_text      text,
  caption       text,
  sort_order    integer       NOT NULL DEFAULT 0,
  is_cover      boolean       NOT NULL DEFAULT false,
  width         integer,
  height        integer,
  file_size     bigint,
  mime_type     text,
  created_at    timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT unit_images_pkey PRIMARY KEY (id),
  CONSTRAINT unit_images_storage_path_unique UNIQUE (storage_path),
  CONSTRAINT unit_images_sort_order_check CHECK (sort_order >= 0),
  CONSTRAINT unit_images_width_check CHECK (width IS NULL OR width > 0),
  CONSTRAINT unit_images_height_check CHECK (height IS NULL OR height > 0),
  CONSTRAINT unit_images_file_size_check CHECK (file_size IS NULL OR file_size > 0)
);

-- Partial UNIQUE: max one cover per unit
CREATE UNIQUE INDEX IF NOT EXISTS idx_unit_images_cover
  ON nature_stay.unit_images (unit_id)
  WHERE is_cover = true;

CREATE INDEX IF NOT EXISTS idx_unit_images_unit_sort
  ON nature_stay.unit_images (unit_id, sort_order);

-- ============================================================================
-- 3. Foreign keys
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_images_property_id_fkey'
      AND table_name = 'property_images'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.property_images
      ADD CONSTRAINT property_images_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES nature_stay.properties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unit_images_unit_id_fkey'
      AND table_name = 'unit_images'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.unit_images
      ADD CONSTRAINT unit_images_unit_id_fkey
      FOREIGN KEY (unit_id) REFERENCES nature_stay.units(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 4. RLS on property_images
-- ============================================================================
ALTER TABLE nature_stay.property_images ENABLE ROW LEVEL SECURITY;

-- SELECT: anon via parent property publicly visible
DROP POLICY IF EXISTS "property_images_select_anon" ON nature_stay.property_images;
CREATE POLICY "property_images_select_anon"
ON nature_stay.property_images FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    WHERE p.id = property_images.property_id
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
DROP POLICY IF EXISTS "property_images_select_owner" ON nature_stay.property_images;
CREATE POLICY "property_images_select_owner"
ON nature_stay.property_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_images.property_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "property_images_select_super_admin" ON nature_stay.property_images;
CREATE POLICY "property_images_select_super_admin"
ON nature_stay.property_images FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner
DROP POLICY IF EXISTS "property_images_insert_owner" ON nature_stay.property_images;
CREATE POLICY "property_images_insert_owner"
ON nature_stay.property_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_images.property_id
      AND hp.user_id = auth.uid()
  )
);

-- UPDATE: owner
DROP POLICY IF EXISTS "property_images_update_owner" ON nature_stay.property_images;
CREATE POLICY "property_images_update_owner"
ON nature_stay.property_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_images.property_id
      AND hp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_images.property_id
      AND hp.user_id = auth.uid()
  )
);

-- DELETE: owner
DROP POLICY IF EXISTS "property_images_delete_owner" ON nature_stay.property_images;
CREATE POLICY "property_images_delete_owner"
ON nature_stay.property_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = property_images.property_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. RLS on unit_images
-- ============================================================================
ALTER TABLE nature_stay.unit_images ENABLE ROW LEVEL SECURITY;

-- SELECT: anon via parent unit/property publicly visible
DROP POLICY IF EXISTS "unit_images_select_anon" ON nature_stay.unit_images;
CREATE POLICY "unit_images_select_anon"
ON nature_stay.unit_images FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    WHERE u.id = unit_images.unit_id
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
DROP POLICY IF EXISTS "unit_images_select_owner" ON nature_stay.unit_images;
CREATE POLICY "unit_images_select_owner"
ON nature_stay.unit_images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_images.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "unit_images_select_super_admin" ON nature_stay.unit_images;
CREATE POLICY "unit_images_select_super_admin"
ON nature_stay.unit_images FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner
DROP POLICY IF EXISTS "unit_images_insert_owner" ON nature_stay.unit_images;
CREATE POLICY "unit_images_insert_owner"
ON nature_stay.unit_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_images.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- UPDATE: owner
DROP POLICY IF EXISTS "unit_images_update_owner" ON nature_stay.unit_images;
CREATE POLICY "unit_images_update_owner"
ON nature_stay.unit_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_images.unit_id
      AND hp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_images.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- DELETE: owner
DROP POLICY IF EXISTS "unit_images_delete_owner" ON nature_stay.unit_images;
CREATE POLICY "unit_images_delete_owner"
ON nature_stay.unit_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.units u
    JOIN nature_stay.properties p ON p.id = u.property_id
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE u.id = unit_images.unit_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 6. Grants on image tables
-- ============================================================================
GRANT SELECT ON nature_stay.property_images TO anon, authenticated;
GRANT SELECT ON nature_stay.unit_images TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.property_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.unit_images TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.property_images TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.unit_images TO service_role;
