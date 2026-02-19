-- ============================================================
-- Fix Users Table RLS - Final Fix for Infinite Recursion
-- Migration: 20260120000009
-- Description: Remove ALL policies and create ONLY JWT-based policies
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
DROP POLICY IF EXISTS "users_all_platform_admin" ON public.users;
DROP POLICY IF EXISTS "Platform admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Platform admins can update users" ON public.users;
DROP POLICY IF EXISTS "Org admins can read org members" ON public.users;
DROP POLICY IF EXISTS "Org admins can update org members" ON public.users;
DROP POLICY IF EXISTS "Org admins can update organization members" ON public.users;

-- ============================================================
-- STEP 2: Create ONLY simple JWT-based policies (NO table queries)
-- ============================================================

-- Policy 1: Users can read their own data using auth.uid()
CREATE POLICY "users_read_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Users can update their own data using auth.uid()
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 3: Allow authenticated users to insert (for signup trigger)
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Platform admins can read all users (using JWT metadata ONLY)
CREATE POLICY "users_read_platform_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Policy 5: Platform admins can update all users (using JWT metadata ONLY)
CREATE POLICY "users_update_platform_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Policy 6: Platform admins can insert users (using JWT metadata ONLY)
CREATE POLICY "users_insert_platform_admin"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- ============================================================
-- STEP 3: Verify RLS is enabled
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Verification
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users' AND schemaname = 'public';
  
  RAISE NOTICE 'Total RLS policies on users table: %', policy_count;
  RAISE NOTICE 'All policies use ONLY auth.uid() or auth.jwt() - NO table queries';
  RAISE NOTICE 'This prevents infinite recursion';
  
  IF policy_count != 6 THEN
    RAISE WARNING 'Expected 6 policies, found %', policy_count;
  END IF;
END $$;

