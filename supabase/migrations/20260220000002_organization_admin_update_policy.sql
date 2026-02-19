-- =====================================================
-- Organization Admin Update Policy
-- Migration: 20260220000002
-- Description: Allow org admins to update their organization
--              (for logo, banner, and profile edits)
-- =====================================================

CREATE POLICY "organizations_update_own_by_admin"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = public.get_user_organization_id()
    AND public.get_user_role() = 'org_admin'
  )
  WITH CHECK (
    id = public.get_user_organization_id()
    AND public.get_user_role() = 'org_admin'
  );
