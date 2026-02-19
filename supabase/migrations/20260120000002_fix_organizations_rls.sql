-- ============================================================
-- Fix Organizations RLS Policies
-- Migration: 20260120000002
-- Description: Remove all old recursive policies and keep only JWT-based ones
-- ============================================================

-- ============================================================
-- STEP 1: Drop ALL existing policies on organizations table
-- ============================================================

DROP POLICY IF EXISTS "Platform admins can read all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization members can read own organization" ON public.organizations;
DROP POLICY IF EXISTS "Organization admins can update own organization" ON public.organizations;
DROP POLICY IF EXISTS "Platform admins can update organizations" ON public.organizations;
DROP POLICY IF EXISTS "Platform admins can insert organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_all" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_members" ON public.organizations;
DROP POLICY IF EXISTS "organizations_all_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_platform_admin" ON public.organizations;

-- ============================================================
-- STEP 2: Create ONLY JWT-based policies (no recursion)
-- ============================================================

-- Policy 1: Organization members can read their own organization
-- Uses JWT metadata to avoid querying users table
CREATE POLICY "organizations_select_own"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (auth.jwt()->>'organization_id')::uuid
  );

-- Policy 2: Platform admins can do everything with organizations
-- Uses JWT metadata to avoid querying users table
CREATE POLICY "organizations_all_platform_admin"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- ============================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Verification
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'organizations';
  
  RAISE NOTICE 'Total RLS policies on organizations table: %', policy_count;
  
  IF policy_count != 2 THEN
    RAISE WARNING 'Expected 2 policies, found %', policy_count;
  END IF;
END $$;

