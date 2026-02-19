-- =====================================================
-- Fix Bank Transfer RLS - Use correct JWT path
-- Migration: 20260124000006
-- Description: Fix RLS to use correct JWT metadata path
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Platform admins can read all bank transfer submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Platform admins can update bank transfer submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Users can read their own submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON bank_transfer_submissions;

-- Create policy for platform admins to read all submissions
-- Using user_metadata path in JWT
CREATE POLICY "Platform admins can read all bank transfer submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Create policy for platform admins to update submissions
CREATE POLICY "Platform admins can update bank transfer submissions"
  ON bank_transfer_submissions
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Create policy for users to read their own submissions
CREATE POLICY "Users can read their own submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Create policy for users to create their own submissions
CREATE POLICY "Users can create their own submissions"
  ON bank_transfer_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

