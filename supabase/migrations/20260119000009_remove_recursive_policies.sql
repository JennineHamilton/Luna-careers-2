-- ============================================================
-- Remove Recursive RLS Policies
-- Migration: 20260119000009
-- Description: Remove all policies with EXISTS subqueries that cause recursion
-- ============================================================

-- ============================================================
-- STEP 1: Drop ALL existing policies on users table
-- ============================================================

DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow trigger insert" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_select_org_members" ON public.users;
DROP POLICY IF EXISTS "users_update_org_members" ON public.users;
DROP POLICY IF EXISTS "users_select_platform_admin" ON public.users;
DROP POLICY IF EXISTS "users_update_platform_admin" ON public.users;
DROP POLICY IF EXISTS "Platform admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Platform admins can update users" ON public.users;
DROP POLICY IF EXISTS "Org admins can read org members" ON public.users;
DROP POLICY IF EXISTS "Org admins can update org members" ON public.users;

-- ============================================================
-- STEP 2: Create ONLY JWT-based policies (no recursion)
-- ============================================================

-- Policy 1: Users can read their own data
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own data (limited fields)
-- Note: We can't prevent field changes in RLS without causing recursion
-- Field validation should be done in application code or triggers
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Platform admins can do everything (using JWT metadata - NO recursion)
CREATE POLICY "users_all_platform_admin"
  ON public.users
  FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Policy 4: Allow service role to insert (for triggers)
CREATE POLICY "users_insert_service_role"
  ON public.users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- STEP 3: Drop ALL existing policies on organizations table
-- ============================================================

DROP POLICY IF EXISTS "Org members can read their org" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_all_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "Platform admins can read all orgs" ON public.organizations;

-- ============================================================
-- STEP 4: Create ONLY JWT-based policies for organizations
-- ============================================================

-- Policy 1: Organization members can read their own organization
CREATE POLICY "organizations_select_own"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (auth.jwt()->>'organization_id')::uuid
  );

-- Policy 2: Platform admins can do everything with organizations
CREATE POLICY "organizations_all_platform_admin"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- ============================================================
-- STEP 5: Verify RLS is enabled
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

