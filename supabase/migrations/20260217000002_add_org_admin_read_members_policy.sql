-- ============================================================
-- Add RLS Policy for Organization Admins to Read Team Members
-- Migration: 20260217000002
-- Description: Allows organization admins and HR managers to read
--              members of their organization using JWT metadata
-- ============================================================

-- Policy: Organization admins can read members of their organization
-- Uses JWT metadata to avoid infinite recursion
CREATE POLICY "users_read_org_members"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- User's organization_id (from JWT) matches the row's organization_id
    organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
    -- AND the authenticated user has admin/HR role
    AND (auth.jwt()->>'user_metadata')::jsonb->>'user_role' IN ('org_admin', 'hr_manager', 'recruiter', 'hiring_manager')
  );

-- Policy: Organization admins can update members of their organization (limited fields)
CREATE POLICY "users_update_org_members"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- User's organization_id (from JWT) matches the row's organization_id
    organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
    -- AND the authenticated user has admin role
    AND (auth.jwt()->>'user_metadata')::jsonb->>'user_role' = 'org_admin'
  )
  WITH CHECK (
    -- User's organization_id (from JWT) matches the row's organization_id
    organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
    -- AND the authenticated user has admin role
    AND (auth.jwt()->>'user_metadata')::jsonb->>'user_role' = 'org_admin'
  );

-- Verification
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'users' AND schemaname = 'public';
  
  RAISE NOTICE 'Total RLS policies on users table: %', policy_count;
  RAISE NOTICE 'Added policies for organization admins to read/update team members';
END $$;

