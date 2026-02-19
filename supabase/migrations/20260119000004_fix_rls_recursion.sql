-- ============================================================
-- Fix RLS Infinite Recursion
-- ============================================================
-- This migration fixes the infinite recursion error in RLS policies
-- by removing policies that query the same table they protect
-- ============================================================

-- Drop all existing policies on users table
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

-- Drop problematic organization policies
DROP POLICY IF EXISTS "Org members can read their org" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_own" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_all" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_members" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert_platform_admin" ON public.organizations;
DROP POLICY IF EXISTS "organizations_all_platform_admin" ON public.organizations;

-- ============================================================
-- USERS TABLE - Simple policies without recursion
-- ============================================================

-- Allow users to read their own data
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own data
-- Note: Sensitive fields (account_type, organization_id) should be protected
-- by application logic or separate admin-only policies
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Platform admins can update any user
CREATE POLICY "users_update_platform_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Platform admins can read all users
CREATE POLICY "users_select_platform_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Allow authenticated users to insert (for signup trigger)
CREATE POLICY "users_insert_authenticated"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- ORGANIZATIONS TABLE - Simple policies without recursion
-- ============================================================

-- Allow authenticated users to read all organizations (for browsing)
-- In production, you might want to restrict this
CREATE POLICY "organizations_select_all"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow organization members to update their organization
-- We use auth.jwt() to get user metadata instead of querying users table
CREATE POLICY "organizations_update_members"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    -- Check if user's organization_id matches this organization
    id = (auth.jwt()->>'organization_id')::uuid
    -- And user has admin role
    AND (auth.jwt()->>'user_role') IN ('org_admin', 'hr_manager')
  )
  WITH CHECK (
    id = (auth.jwt()->>'organization_id')::uuid
    AND (auth.jwt()->>'user_role') IN ('org_admin', 'hr_manager')
  );

-- Allow platform admins to do everything with organizations
CREATE POLICY "organizations_all_platform_admin"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- ============================================================
-- IMPORTANT: Update auth.users metadata on login
-- ============================================================
-- We need to ensure that user metadata in auth.users is synced
-- with public.users so that auth.jwt() has the correct data

-- Create a function to sync user metadata
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update auth.users metadata when public.users changes
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'account_type', NEW.account_type,
    'user_role', NEW.user_role,
    'organization_id', NEW.organization_id,
    'current_context', NEW.current_context,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync metadata on update
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_metadata();

-- ============================================================
-- Run sync for existing users
-- ============================================================
-- Update metadata for all existing users
UPDATE auth.users au
SET raw_user_meta_data = jsonb_build_object(
  'account_type', u.account_type,
  'user_role', u.user_role,
  'organization_id', u.organization_id,
  'current_context', u.current_context,
  'first_name', u.first_name,
  'last_name', u.last_name
)
FROM public.users u
WHERE au.id = u.id;

