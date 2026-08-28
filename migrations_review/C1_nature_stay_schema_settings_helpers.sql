-- ============================================================================
-- Migration: C1 — nature_stay schema + settings + helpers
-- Purpose: Create nature_stay schema, singleton settings, trigger helpers
-- Schema: nature_stay (new)
-- Backwards-compatible: YES (new schema, no modifications to existing objects)
-- ToursRed impact: NONE
-- ============================================================================
--
-- Objects created:
--   - Schema: nature_stay
--   - Function: nature_stay.update_updated_at() — trigger helper for updated_at
--   - Function: nature_stay.validate_timezone() — trigger helper for
--     timezone validation against pg_timezone_names
--   - Table: nature_stay.settings (singleton row)
--
-- Hardening:
--   REVOKE ALL ON SCHEMA nature_stay FROM PUBLIC
--   GRANT USAGE ON SCHEMA nature_stay TO anon
--   GRANT USAGE ON SCHEMA nature_stay TO authenticated
--   GRANT USAGE ON SCHEMA nature_stay TO service_role
--
-- anon gets USAGE because it needs to access public views and catalog SELECT.
-- RLS policies + column-level privileges control exactly what anon can see.
--
-- Function EXECUTE privileges:
--   REVOKE EXECUTE FROM PUBLIC
--   GRANT EXECUTE TO authenticated, service_role
--
-- Settings:
--   authenticated: SELECT only
--   service_role: full CRUD (bypasses RLS)
--   No UPDATE for authenticated or super_admin from client.
--   Settings changes must go through backend/Edge Function with service_role.
--
-- 0 SECURITY DEFINER functions.
-- All functions: SECURITY INVOKER + explicit search_path.
-- ============================================================================

-- ============================================================================
-- 1. Schema creation
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS nature_stay;

-- ============================================================================
-- 2. Schema-level hardening
-- ============================================================================
REVOKE ALL ON SCHEMA nature_stay FROM PUBLIC;
GRANT USAGE ON SCHEMA nature_stay TO anon;
GRANT USAGE ON SCHEMA nature_stay TO authenticated;
GRANT USAGE ON SCHEMA nature_stay TO service_role;

-- ============================================================================
-- 3. Function: nature_stay.update_updated_at()
-- Purpose: Trigger helper that sets NEW.updated_at = now()
-- Security: SECURITY INVOKER, search_path = nature_stay, pg_temp
-- ============================================================================

CREATE OR REPLACE FUNCTION nature_stay.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = nature_stay, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nature_stay.update_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nature_stay.update_updated_at() TO authenticated, service_role;

-- ============================================================================
-- 4. Function: nature_stay.validate_timezone()
-- Purpose: Trigger helper that validates NEW.timezone against pg_timezone_names
-- Security: SECURITY INVOKER, search_path = pg_catalog, pg_temp
-- Intended for BEFORE INSERT OR UPDATE OF timezone on nature_stay.properties
-- ============================================================================

CREATE OR REPLACE FUNCTION nature_stay.validate_timezone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_timezone_names
    WHERE name = NEW.timezone
  ) THEN
    RAISE EXCEPTION
      'Invalid timezone "%" for record %. Must be a valid IANA timezone identifier known to PostgreSQL.',
      NEW.timezone, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION nature_stay.validate_timezone() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nature_stay.validate_timezone() TO authenticated, service_role;

-- ============================================================================
-- 5. Table: nature_stay.settings (singleton)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nature_stay.settings (
  id                              uuid            NOT NULL DEFAULT gen_random_uuid(),
  host_commission_percentage      numeric(5,2)    NOT NULL DEFAULT 15.00,
  guest_service_fee_percentage    numeric(5,2)    NOT NULL DEFAULT 5.00,
  booking_hold_minutes            integer         NOT NULL DEFAULT 15,
  minimum_booking_lead_hours      integer         NOT NULL DEFAULT 24,
  booking_request_expiration_hours integer        NOT NULL DEFAULT 48,
  max_images_per_property         integer         NOT NULL DEFAULT 20,
  max_images_per_unit             integer         NOT NULL DEFAULT 15,
  max_guests_per_booking          integer         NOT NULL DEFAULT 20,
  default_currency                text            NOT NULL DEFAULT 'MXN',
  instant_booking_enabled         boolean         NOT NULL DEFAULT true,
  request_booking_enabled         boolean         NOT NULL DEFAULT true,
  ical_sync_enabled               boolean         NOT NULL DEFAULT false,
  created_at                      timestamptz     NOT NULL DEFAULT now(),
  updated_at                      timestamptz     NOT NULL DEFAULT now(),

  CONSTRAINT settings_singleton CHECK (id = '00000000-0000-0000-0000-000000000001'),
  CONSTRAINT settings_commission_range CHECK (host_commission_percentage BETWEEN 0 AND 100),
  CONSTRAINT settings_fee_range CHECK (guest_service_fee_percentage BETWEEN 0 AND 100),
  CONSTRAINT settings_hold_minutes CHECK (booking_hold_minutes > 0),
  CONSTRAINT settings_lead_hours CHECK (minimum_booking_lead_hours >= 0),
  CONSTRAINT settings_expiration_hours CHECK (booking_request_expiration_hours > 0),
  CONSTRAINT settings_max_images_property CHECK (max_images_per_property > 0),
  CONSTRAINT settings_max_images_unit CHECK (max_images_per_unit > 0),
  CONSTRAINT settings_max_guests CHECK (max_guests_per_booking > 0),
  CONSTRAINT settings_currency_format CHECK (default_currency ~ '^[A-Z]{3}$'),

  PRIMARY KEY (id)
);

-- ============================================================================
-- 6. Insert singleton row
-- ============================================================================
INSERT INTO nature_stay.settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. RLS on settings
-- ============================================================================
ALTER TABLE nature_stay.settings ENABLE ROW LEVEL SECURITY;

-- authenticated can SELECT settings (needed to display fees/commission)
DROP POLICY IF EXISTS "settings_select_authenticated" ON nature_stay.settings;
CREATE POLICY "settings_select_authenticated"
ON nature_stay.settings FOR SELECT
TO authenticated USING (true);

-- anon cannot read settings (no policy for anon = no access)
-- service_role bypasses RLS

-- ============================================================================
-- 8. Grants on settings
-- ============================================================================
GRANT SELECT ON nature_stay.settings TO authenticated;
-- No UPDATE/INSERT/DELETE grants to authenticated or anon.
-- service_role gets explicit grants (bypasses RLS):
GRANT SELECT, INSERT, UPDATE, DELETE ON nature_stay.settings TO service_role;
