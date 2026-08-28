-- ============================================================================
-- Migration: 005_points_transactions_platform
-- Purpose: Add platform column to toursred_points_transactions for cross-platform
--          traceability
-- Schema: public
-- Backwards-compatible: YES
-- ToursRed impact: MINIMAL (new nullable column with DEFAULT, no changes to
--                  existing columns, RLS, triggers, or functions)
-- ============================================================================
--
-- The platform column separates the platform dimension from reference_type.
--
-- Example:
--   platform        = 'naturestayred'
--   reference_type  = 'booking'         (already exists in the CHECK constraint)
--   reference_id    = <UUID of nature_stay.bookings row>
--
-- Nature Stay will use reference_type='booking' (already allowed) combined
-- with platform='naturestayred'. No new reference_type values are needed
-- for the basic booking flow. Cancellation-related reference_types will be
-- evaluated in Block D when the booking engine is implemented.
--
-- COMPATIBILITY NOTE:
--   The DEFAULT 'toursred' is a TEMPORARY measure to ensure existing Edge
--   Functions that insert into toursred_points_transactions without specifying
--   platform continue to work. Once all write paths explicitly set platform,
--   a future migration will remove this DEFAULT and add a NOT NULL constraint.
-- ============================================================================

ALTER TABLE public.toursred_points_transactions
  ADD COLUMN IF NOT EXISTS platform text DEFAULT 'toursred';

COMMENT ON COLUMN public.toursred_points_transactions.platform IS
  'Platform identifier: toursred, naturestayred, routesred, ecosystem, system. TEMPORARY DEFAULT toursred for backwards compatibility with existing Edge Functions.';

-- Backfill existing rows
UPDATE public.toursred_points_transactions
SET platform = 'toursred'
WHERE platform IS NULL;

-- Add CHECK constraint (guarded for re-execution safety)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'toursred_points_transactions_platform_check'
      AND conrelid = 'public.toursred_points_transactions'::regclass
  ) THEN
    ALTER TABLE public.toursred_points_transactions
      ADD CONSTRAINT toursred_points_transactions_platform_check
      CHECK (platform IN ('toursred', 'naturestayred', 'routesred', 'ecosystem', 'system'));
  END IF;
END $$;

-- Index for analytics and filtering by platform
CREATE INDEX IF NOT EXISTS idx_points_transactions_platform
  ON public.toursred_points_transactions (platform);
