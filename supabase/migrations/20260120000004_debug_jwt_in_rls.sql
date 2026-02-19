-- ============================================================
-- Debug JWT in RLS Policy
-- Migration: 20260120000004
-- Description: Add a test function to check what auth.jwt() returns
-- ============================================================

-- Create a function to test what auth.jwt() returns
CREATE OR REPLACE FUNCTION public.test_jwt_metadata()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.jwt();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.test_jwt_metadata() TO authenticated;

-- Test query (run this manually in SQL editor after logging in as org admin):
-- SELECT public.test_jwt_metadata();
-- SELECT auth.jwt()->>'organization_id';
-- SELECT (auth.jwt()->>'organization_id')::uuid;

