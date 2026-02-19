-- ============================================================
-- Fix RLS Policies Using Helper Functions
-- Migration: 20260120000006
-- Description: Use SECURITY DEFINER functions to bypass RLS recursion
-- ============================================================

-- ============================================================
-- STEP 1: Create helper functions to get user data
-- ============================================================

-- Function to get user's organization_id
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id
  FROM public.users
  WHERE id = auth.uid();
$$;

-- Function to get user's account_type
CREATE OR REPLACE FUNCTION public.get_user_account_type()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT account_type::text
  FROM public.users
  WHERE id = auth.uid();
$$;

-- Function to get user's user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT user_role::text
  FROM public.users
  WHERE id = auth.uid();
$$;

-- ============================================================
-- STEP 2: Drop all existing policies on organizations table
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
-- STEP 3: Create new policies using helper functions
-- ============================================================

-- Policy 1: Organization members can read their own organization
CREATE POLICY "organizations_select_own"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = public.get_user_organization_id()
  );

-- Policy 2: Platform admins can do everything with organizations
CREATE POLICY "organizations_all_platform_admin"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (
    public.get_user_account_type() = 'platformAdmin'
  )
  WITH CHECK (
    public.get_user_account_type() = 'platformAdmin'
  );

-- ============================================================
-- STEP 4: Verify RLS is enabled
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Grant execute permissions
-- ============================================================

GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_account_type() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;

-- ============================================================
-- STEP 6: Verification
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'organizations';
  
  RAISE NOTICE 'Total RLS policies on organizations table: %', policy_count;
  RAISE NOTICE 'Helper functions created in auth schema with SECURITY DEFINER';
  RAISE NOTICE 'This allows RLS policies to query users table without recursion';
  
  IF policy_count != 2 THEN
    RAISE WARNING 'Expected 2 policies, found %', policy_count;
  END IF;
END $$;

