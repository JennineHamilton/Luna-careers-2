-- ============================================================
-- Fix Platform Admin RLS Policies
-- Migration: 20260119000007
-- Description: Ensure platform admins can read all users and organizations
-- ============================================================

-- ============================================================
-- ORGANIZATIONS TABLE - Add platform admin read policy
-- ============================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "organizations_select_platform_admin" ON public.organizations;

-- Platform admins can read all organizations
CREATE POLICY "organizations_select_platform_admin"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

-- ============================================================
-- USERS TABLE - Verify platform admin can read all users
-- ============================================================

-- Drop and recreate to ensure it's correct
DROP POLICY IF EXISTS "users_select_platform_admin" ON public.users;

CREATE POLICY "users_select_platform_admin"
  ON public.users
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

