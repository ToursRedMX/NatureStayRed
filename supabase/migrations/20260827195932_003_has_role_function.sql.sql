-- ============================================================================
-- Migration: 003_has_role_function
-- Purpose: Helper function for RLS policies of Nature Stay and future verticals
-- Schema: public
-- Backwards-compatible: YES (new function, no modifications to existing)
-- ToursRed impact: NONE (ToursRed does not use this function)
-- ============================================================================
--
-- Checks whether the current authenticated user (auth.uid()) has a specific
-- active role on a specific platform.
--
-- Security decisions:
--   - SECURITY INVOKER: runs with the caller's privileges. user_roles has RLS
--     that allows users to see their own roles, so this is safe.
--   - STABLE: does not modify data, results are stable within a transaction.
--   - search_path explicitly set to prevent search_path injection.
--   - Does NOT accept an arbitrary user_id parameter (prevents privilege
--     checking for other users).
--
-- ToursRed continues using users.role directly. This function is for
-- Nature Stay, RoutesRed, and future verticals only.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(
  p_role     text,
  p_platform text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = p_role
      AND ur.platform = p_platform
      AND ur.is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(text, text) TO authenticated;
