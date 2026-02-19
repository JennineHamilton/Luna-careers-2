-- =====================================================
-- Fix Bank Transfer Submissions RLS Policies
-- Migration: 20260124000003
-- Description: Fix infinite recursion by using JWT metadata instead of querying users table
-- =====================================================

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Platform admins can read all bank transfer submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Platform admins can update bank transfer submissions" ON bank_transfer_submissions;

-- Recreate policies using JWT metadata (no table queries)
CREATE POLICY "Platform admins can read all bank transfer submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

CREATE POLICY "Platform admins can update bank transfer submissions"
  ON bank_transfer_submissions
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

-- Also fix payment_settings policies
DROP POLICY IF EXISTS "Platform admins can create payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Platform admins can update payment settings" ON payment_settings;
DROP POLICY IF EXISTS "Platform admins can delete payment settings" ON payment_settings;

CREATE POLICY "Platform admins can create payment settings"
  ON payment_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

CREATE POLICY "Platform admins can update payment settings"
  ON payment_settings
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt()->>'account_type') = 'platformAdmin');

CREATE POLICY "Platform admins can delete payment settings"
  ON payment_settings
  FOR DELETE
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

