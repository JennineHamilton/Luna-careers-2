-- =====================================================
-- Debug and Fix Bank Transfer Submissions RLS
-- Migration: 20260124000005
-- Description: Ensure RLS policies are correctly set up for platform admins
-- =====================================================

-- First, let's ensure RLS is enabled
ALTER TABLE bank_transfer_submissions ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Platform admins can read all bank transfer submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Platform admins can update bank transfer submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Users can read their own submissions" ON bank_transfer_submissions;
DROP POLICY IF EXISTS "Users can create their own submissions" ON bank_transfer_submissions;

-- Create policy for platform admins to read all submissions
CREATE POLICY "Platform admins can read all bank transfer submissions"
  ON bank_transfer_submissions
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Create policy for platform admins to update submissions (for approval/rejection)
CREATE POLICY "Platform admins can update bank transfer submissions"
  ON bank_transfer_submissions
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
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

