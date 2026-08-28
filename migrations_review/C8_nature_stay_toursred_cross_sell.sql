-- ============================================================================
-- Migration: C8 — nature_stay property_tour_links + public view (ToursRed cross-sell)
-- Purpose: Create property_tour_links table linking Nature Stay properties
--          to ToursRed tours for cross-sell, with public security_barrier view
-- Schema: nature_stay
-- Backwards-compatible: YES (new table + new view)
-- ToursRed impact: NONE (read-only FK to public.tours, no modifications)
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.property_tour_links
--   - View:  nature_stay.property_tour_links_public (security_barrier)
--
-- Dependencies:
--   C4 (properties for FK)
--   C3 (host_accounts for ownership path)
--   public.tours (existing ToursRed table, read-only FK)
--
-- ARCHITECTURE:
--   Base table: owner/admin only via RLS. NO anon access.
--   Marketplace reads: property_tour_links_public security_barrier view.
--   Ownership path: auth.uid() → host_accounts → properties → tour_links
--
-- Column names preserved from original: active, featured, display_order,
-- discount_type, discount_value, valid_from, valid_until.
-- NOTE: column is named "active" (NOT "is_active").
--
-- Constraints:
--   UNIQUE(property_id, tour_id)
--   discount pair consistency (both null or both not null)
--   percentage: 0-100
--   fixed: >= 0
--   display_order >= 0
--   date consistency: valid_until >= valid_from
--
-- Does NOT modify public.tours.
--
-- 0 functions. 0 triggers. 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.property_tour_links
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.property_tour_links (
  id              uuid          NOT NULL DEFAULT gen_random_uuid(),
  property_id     uuid          NOT NULL,
  tour_id         uuid          NOT NULL,
  active          boolean       NOT NULL DEFAULT true,
  featured        boolean       NOT NULL DEFAULT false,
  display_order   integer       NOT NULL DEFAULT 0,
  discount_type   text,
  discount_value  numeric(10,2),
  valid_from      date,
  valid_until     date,
  created_at      timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT property_tour_links_pkey PRIMARY KEY (id),
  CONSTRAINT property_tour_links_pair_unique UNIQUE (property_id, tour_id),
  CONSTRAINT property_tour_links_discount_type_check CHECK (
    discount_type IS NULL OR discount_type IN ('percentage','fixed')
  ),
  CONSTRAINT property_tour_links_discount_pair_consistency CHECK (
    (discount_type IS NULL AND discount_value IS NULL)
    OR (discount_type IS NOT NULL AND discount_value IS NOT NULL)
  ),
  CONSTRAINT property_tour_links_discount_percentage_range CHECK (
    discount_type <> 'percentage'
    OR (discount_value IS NOT NULL AND discount_value BETWEEN 0 AND 100)
  ),
  CONSTRAINT property_tour_links_discount_fixed_range CHECK (
    discount_type <> 'fixed'
    OR (discount_value IS NOT NULL AND discount_value >= 0)
  ),
  CONSTRAINT property_tour_links_display_order_check CHECK (display_order >= 0),
  CONSTRAINT property_tour_links_date_consistency CHECK (
    valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from
  )
);

CREATE INDEX IF NOT EXISTS idx_property_tour_links_property_id
  ON nature_stay.property_tour_links (property_id);

CREATE INDEX IF NOT EXISTS idx_property_tour_links_tour_id
  ON nature_stay.property_tour_links (tour_id);

CREATE INDEX IF NOT EXISTS idx_property_tour_links_active_featured
  ON nature_stay.property_tour_links (property_id, active, featured, display_order);

-- ============================================================================
-- 2. Foreign keys
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_tour_links_property_id_fkey'
      AND table_name = 'property_tour_links'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.property_tour_links
      ADD CONSTRAINT property_tour_links_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES nature_stay.properties(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'property_tour_links_tour_id_fkey'
      AND table_name = 'property_tour_links'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.property_tour_links
      ADD CONSTRAINT property_tour_links_tour_id_fkey
      FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 3. RLS on property_tour_links
-- ============================================================================
ALTER TABLE nature_stay.property_tour_links ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated owner
DROP POLICY IF EXISTS "property_tour_links_select_owner" ON nature_stay.property_tour_links;
CREATE POLICY "property_tour_links_select_owner"
ON nature_stay.property_tour_links FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    JOIN nature_stay.properties p ON p.host_id = ha.host_id
    WHERE ha.user_id = auth.uid()
      AND p.id = property_tour_links.property_id
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "property_tour_links_select_super_admin" ON nature_stay.property_tour_links;
CREATE POLICY "property_tour_links_select_super_admin"
ON nature_stay.property_tour_links FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: owner
DROP POLICY IF EXISTS "property_tour_links_insert_owner" ON nature_stay.property_tour_links;
CREATE POLICY "property_tour_links_insert_owner"
ON nature_stay.property_tour_links FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    JOIN nature_stay.properties p ON p.host_id = ha.host_id
    WHERE ha.user_id = auth.uid()
      AND p.id = property_tour_links.property_id
  )
);

-- UPDATE: owner
DROP POLICY IF EXISTS "property_tour_links_update_owner" ON nature_stay.property_tour_links;
CREATE POLICY "property_tour_links_update_owner"
ON nature_stay.property_tour_links FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    JOIN nature_stay.properties p ON p.host_id = ha.host_id
    WHERE ha.user_id = auth.uid()
      AND p.id = property_tour_links.property_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    JOIN nature_stay.properties p ON p.host_id = ha.host_id
    WHERE ha.user_id = auth.uid()
      AND p.id = property_tour_links.property_id
  )
);

-- DELETE: owner
DROP POLICY IF EXISTS "property_tour_links_delete_owner" ON nature_stay.property_tour_links;
CREATE POLICY "property_tour_links_delete_owner"
ON nature_stay.property_tour_links FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.host_accounts ha
    JOIN nature_stay.properties p ON p.host_id = ha.host_id
    WHERE ha.user_id = auth.uid()
      AND p.id = property_tour_links.property_id
  )
);

-- No SELECT policy for anon — marketplace reads use property_tour_links_public view.

-- ============================================================================
-- 4. Grants on property_tour_links
-- ============================================================================

-- anon: NO grants on base table.
-- authenticated: SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.property_tour_links TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.property_tour_links TO service_role;

-- ============================================================================
-- 5. View: nature_stay.property_tour_links_public (security_barrier)
-- ============================================================================

CREATE OR REPLACE VIEW nature_stay.property_tour_links_public
WITH (security_barrier = true) AS
SELECT
  ptl.id,
  ptl.property_id,
  ptl.tour_id,
  ptl.active,
  ptl.featured,
  ptl.display_order,
  ptl.discount_type,
  ptl.discount_value,
  ptl.valid_from,
  ptl.valid_until,
  ptl.created_at
FROM nature_stay.property_tour_links ptl
WHERE ptl.active = true
  AND EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_accounts ha ON ha.host_id = p.host_id
    WHERE p.id = ptl.property_id
      AND p.status = 'active'
      AND p.is_published = true
      AND p.verification_status = 'verified'
      AND p.archived_at IS NULL
      AND ha.is_active = true
      AND ha.onboarding_status = 'active'
      AND ha.archived_at IS NULL
  );

REVOKE ALL ON nature_stay.property_tour_links_public FROM PUBLIC;
GRANT SELECT ON nature_stay.property_tour_links_public TO anon, authenticated;
