-- ============================================================================
-- Migration: C5 — nature_stay units + units_public view
-- Purpose: Create units table, publication trigger, public view, RLS, grants
-- Schema: nature_stay
-- Backwards-compatible: YES (new table + new view)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Table: nature_stay.units
--   - View:  nature_stay.units_public (security_invoker)
--   - Function: nature_stay.validate_unit_publication()
--   - Trigger: trg_units_updated_at
--   - Trigger: trg_units_validate_publication
--
-- Dependencies:
--   C4 (properties for FK)
--   C2a (unit_types for FK)
--
-- Key changes from earlier design:
--   max_guests:    NOT NULL (was nullable)
--   base_guests:   NOT NULL DEFAULT 1 (was nullable)
--   minimum_nights: NOT NULL DEFAULT 1 (was nullable)
--
-- Column-level INSERT (authenticated):
--   property_id, unit_type_id, name, slug, description, quantity,
--   max_guests, base_guests, max_adults, max_children, max_infants,
--   bedrooms, beds, bathrooms, area_m2, pricing_mode, base_price,
--   extra_guest_price, currency, minimum_nights, maximum_nights,
--   pets_allowed, pet_fee, max_pets, check_in_time_override,
--   check_out_time_override, metadata
--
--   NOT insertable: id, status, is_published, archived_at, created_at, updated_at
--   is_published defaults to false. status defaults to 'draft'.
--
-- Column-level UPDATE (authenticated):
--   unit_type_id, name, slug, description, quantity, max_guests,
--   base_guests, max_adults, max_children, max_infants, bedrooms, beds,
--   bathrooms, area_m2, pricing_mode, base_price, extra_guest_price,
--   currency, minimum_nights, maximum_nights, pets_allowed, pet_fee,
--   max_pets, check_in_time_override, check_out_time_override,
--   is_published, metadata
--
--   NOT updateable: id, property_id, status, archived_at, created_at, updated_at
--
-- 0 SECURITY DEFINER.
-- ============================================================================

-- ============================================================================
-- 1. Table: nature_stay.units
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.units (
  id                      uuid            NOT NULL DEFAULT gen_random_uuid(),
  property_id             uuid            NOT NULL,
  unit_type_id            uuid            NOT NULL,
  name                    text            NOT NULL,
  slug                    text,
  description             text,
  quantity                integer         NOT NULL DEFAULT 1,
  max_guests              integer         NOT NULL,
  base_guests             integer         NOT NULL DEFAULT 1,
  max_adults              integer,
  max_children            integer,
  max_infants             integer,
  bedrooms                integer,
  beds                    integer,
  bathrooms               integer,
  area_m2                 numeric(8,2),
  pricing_mode            text            NOT NULL DEFAULT 'per_unit_per_night',
  base_price              numeric(10,2)   NOT NULL,
  extra_guest_price       numeric(10,2),
  currency                text            NOT NULL DEFAULT 'MXN',
  minimum_nights          integer         NOT NULL DEFAULT 1,
  maximum_nights          integer,
  pets_allowed            boolean,
  pet_fee                 numeric(10,2),
  max_pets                integer,
  check_in_time_override  time,
  check_out_time_override time,
  status                  text            NOT NULL DEFAULT 'draft',
  is_published            boolean         NOT NULL DEFAULT false,
  metadata                jsonb           NOT NULL DEFAULT '{}'::jsonb,
  created_at              timestamptz     NOT NULL DEFAULT now(),
  updated_at              timestamptz     NOT NULL DEFAULT now(),
  archived_at             timestamptz,

  CONSTRAINT units_pkey PRIMARY KEY (id),
  CONSTRAINT units_property_slug_unique UNIQUE (property_id, slug),
  CONSTRAINT units_pricing_mode_check CHECK (pricing_mode IN ('per_unit_per_night','per_person_per_night')),
  CONSTRAINT units_status_check CHECK (status IN ('draft','active','suspended','inactive')),
  CONSTRAINT units_quantity_check CHECK (quantity >= 1),
  CONSTRAINT units_base_price_check CHECK (base_price >= 0),
  CONSTRAINT units_extra_guest_price_check CHECK (extra_guest_price IS NULL OR extra_guest_price >= 0),
  CONSTRAINT units_pet_fee_check CHECK (pet_fee IS NULL OR pet_fee >= 0),
  CONSTRAINT units_max_guests_check CHECK (max_guests >= 1),
  CONSTRAINT units_base_guests_check CHECK (base_guests >= 1),
  CONSTRAINT units_base_le_max_guests CHECK (base_guests <= max_guests),
  CONSTRAINT units_max_adults_check CHECK (max_adults IS NULL OR max_adults >= 0),
  CONSTRAINT units_max_children_check CHECK (max_children IS NULL OR max_children >= 0),
  CONSTRAINT units_max_infants_check CHECK (max_infants IS NULL OR max_infants >= 0),
  CONSTRAINT units_bedrooms_check CHECK (bedrooms IS NULL OR bedrooms >= 0),
  CONSTRAINT units_beds_check CHECK (beds IS NULL OR beds >= 0),
  CONSTRAINT units_bathrooms_check CHECK (bathrooms IS NULL OR bathrooms >= 0),
  CONSTRAINT units_area_m2_check CHECK (area_m2 IS NULL OR area_m2 > 0),
  CONSTRAINT units_max_pets_check CHECK (max_pets IS NULL OR max_pets >= 0),
  CONSTRAINT units_minimum_nights_check CHECK (minimum_nights >= 1),
  CONSTRAINT units_maximum_nights_check CHECK (maximum_nights IS NULL OR maximum_nights >= minimum_nights),
  CONSTRAINT units_pricing_consistency CHECK (
    pricing_mode <> 'per_person_per_night' OR extra_guest_price IS NULL
  ),
  CONSTRAINT units_name_nonempty CHECK (name <> ''),
  CONSTRAINT units_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

-- ============================================================================
-- 2. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_units_property_id
  ON nature_stay.units (property_id);

CREATE INDEX IF NOT EXISTS idx_units_property_status_published_archived
  ON nature_stay.units (property_id, status, is_published, archived_at);

CREATE INDEX IF NOT EXISTS idx_units_unit_type_id
  ON nature_stay.units (unit_type_id);

-- ============================================================================
-- 3. Foreign keys
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'units_property_id_fkey'
      AND table_name = 'units'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.units
      ADD CONSTRAINT units_property_id_fkey
      FOREIGN KEY (property_id) REFERENCES nature_stay.properties(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'units_unit_type_id_fkey'
      AND table_name = 'units'
      AND table_schema = 'nature_stay'
  ) THEN
    ALTER TABLE nature_stay.units
      ADD CONSTRAINT units_unit_type_id_fkey
      FOREIGN KEY (unit_type_id) REFERENCES nature_stay.unit_types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================================
-- 4. RLS on units
-- ============================================================================
ALTER TABLE nature_stay.units ENABLE ROW LEVEL SECURITY;

-- SELECT: anon sees only public units
DROP POLICY IF EXISTS "units_select_anon" ON nature_stay.units;
CREATE POLICY "units_select_anon"
ON nature_stay.units FOR SELECT
TO anon
USING (
  status = 'active'
  AND is_published = true
  AND archived_at IS NULL
  AND EXISTS (
    SELECT 1 FROM nature_stay.properties p
    WHERE p.id = units.property_id
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
DROP POLICY IF EXISTS "units_select_owner" ON nature_stay.units;
CREATE POLICY "units_select_owner"
ON nature_stay.units FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = units.property_id
      AND hp.user_id = auth.uid()
  )
);

-- SELECT: super_admin
DROP POLICY IF EXISTS "units_select_super_admin" ON nature_stay.units;
CREATE POLICY "units_select_super_admin"
ON nature_stay.units FOR SELECT
TO authenticated
USING (public.has_role('super_admin', 'global'));

-- INSERT: host with active operational status
DROP POLICY IF EXISTS "units_insert_owner" ON nature_stay.units;
CREATE POLICY "units_insert_owner"
ON nature_stay.units FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role('host', 'naturestayred')
  AND property_id IN (
    SELECT p.id FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE hp.user_id = auth.uid()
      AND hp.is_active = true
      AND hp.onboarding_status = 'active'
      AND hp.archived_at IS NULL
  )
);

-- UPDATE: owner (column-level grants restrict which columns)
DROP POLICY IF EXISTS "units_update_owner" ON nature_stay.units;
CREATE POLICY "units_update_owner"
ON nature_stay.units FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = units.property_id
      AND hp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM nature_stay.properties p
    JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
    WHERE p.id = units.property_id
      AND hp.user_id = auth.uid()
  )
);

-- ============================================================================
-- 5. Column-level grants on units
-- ============================================================================

-- anon: SELECT only public columns + filter columns needed by the view WHERE
GRANT SELECT (
  id, property_id, unit_type_id, name, slug, description, quantity,
  max_guests, base_guests, max_adults, max_children, max_infants,
  bedrooms, beds, bathrooms, area_m2, pricing_mode, base_price,
  extra_guest_price, currency, minimum_nights, maximum_nights,
  pets_allowed, pet_fee, max_pets, check_in_time_override,
  check_out_time_override, created_at, updated_at,
  status, is_published, archived_at
) ON nature_stay.units TO anon;

-- authenticated: SELECT all
GRANT SELECT ON nature_stay.units TO authenticated;

-- authenticated: INSERT only allowed columns
GRANT INSERT (
  property_id, unit_type_id, name, slug, description, quantity,
  max_guests, base_guests, max_adults, max_children, max_infants,
  bedrooms, beds, bathrooms, area_m2, pricing_mode, base_price,
  extra_guest_price, currency, minimum_nights, maximum_nights,
  pets_allowed, pet_fee, max_pets, check_in_time_override,
  check_out_time_override, metadata
) ON nature_stay.units TO authenticated;

-- authenticated: UPDATE only allowed columns
-- status, archived_at NOT here — admin-controlled
GRANT UPDATE (
  unit_type_id, name, slug, description, quantity, max_guests,
  base_guests, max_adults, max_children, max_infants, bedrooms, beds,
  bathrooms, area_m2, pricing_mode, base_price, extra_guest_price,
  currency, minimum_nights, maximum_nights, pets_allowed, pet_fee,
  max_pets, check_in_time_override, check_out_time_override,
  is_published, metadata
) ON nature_stay.units TO authenticated;

-- service_role: full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.units TO service_role;

-- ============================================================================
-- 6. View: nature_stay.units_public (security_invoker)
-- ============================================================================
-- Does NOT expose: status, is_published, archived_at, metadata

CREATE OR REPLACE VIEW nature_stay.units_public
WITH (security_invoker = true) AS
SELECT
  id,
  property_id,
  unit_type_id,
  name,
  slug,
  description,
  quantity,
  max_guests,
  base_guests,
  max_adults,
  max_children,
  max_infants,
  bedrooms,
  beds,
  bathrooms,
  area_m2,
  pricing_mode,
  base_price,
  extra_guest_price,
  currency,
  minimum_nights,
  maximum_nights,
  pets_allowed,
  pet_fee,
  max_pets,
  check_in_time_override,
  check_out_time_override,
  created_at,
  updated_at
FROM nature_stay.units
WHERE status = 'active'
  AND is_published = true
  AND archived_at IS NULL
  AND EXISTS (
    SELECT 1 FROM nature_stay.properties p
    WHERE p.id = units.property_id
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
  );

GRANT SELECT ON nature_stay.units_public TO anon, authenticated;

-- ============================================================================
-- 7. Function: nature_stay.validate_unit_publication()
-- Purpose: BEFORE INSERT OR UPDATE OF is_published trigger
--          Validates unit + parent property + parent host conditions.
-- Security: SECURITY INVOKER, search_path = nature_stay, pg_temp
-- ============================================================================

CREATE OR REPLACE FUNCTION nature_stay.validate_unit_publication()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nature_stay, pg_temp
AS $$
BEGIN
  IF NEW.is_published = true THEN
    IF NEW.status <> 'active' THEN
      RAISE EXCEPTION 'Cannot publish unit %: status must be active.', NEW.id;
    END IF;
    IF NEW.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot publish unit %: unit is archived.', NEW.id;
    END IF;

    -- Parent property must be published and valid
    IF NOT EXISTS (
      SELECT 1 FROM nature_stay.properties p
      WHERE p.id = NEW.property_id
        AND p.status = 'active'
        AND p.is_published = true
        AND p.verification_status = 'verified'
        AND p.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot publish unit %: parent property is not active, published, and verified.', NEW.id;
    END IF;

    -- Parent host must be operational
    IF NOT EXISTS (
      SELECT 1 FROM nature_stay.properties p
      JOIN nature_stay.host_profiles hp ON hp.id = p.host_id
      WHERE p.id = NEW.property_id
        AND hp.is_active = true
        AND hp.onboarding_status = 'active'
        AND hp.archived_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot publish unit %: parent host is not active.', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nature_stay.validate_unit_publication() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nature_stay.validate_unit_publication() TO authenticated, service_role;

-- ============================================================================
-- 8. Triggers on units
-- ============================================================================

-- updated_at
DROP TRIGGER IF EXISTS trg_units_updated_at ON nature_stay.units;
CREATE TRIGGER trg_units_updated_at
  BEFORE INSERT OR UPDATE ON nature_stay.units
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.update_updated_at();

-- publication validation
DROP TRIGGER IF EXISTS trg_units_validate_publication ON nature_stay.units;
CREATE TRIGGER trg_units_validate_publication
  BEFORE INSERT OR UPDATE OF is_published ON nature_stay.units
  FOR EACH ROW
  EXECUTE FUNCTION nature_stay.validate_unit_publication();
