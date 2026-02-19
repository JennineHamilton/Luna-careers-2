-- =====================================================
-- FIX USER CREDENTIALS STORAGE RLS POLICIES
-- =====================================================
-- This script fixes RLS policies for the user-credentials bucket
-- to allow users to upload videos to their own folder.
--
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- Step 1: Drop ALL existing policies for user-credentials bucket
DROP POLICY IF EXISTS "Users can upload own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own credentials" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can view all credentials" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can update all credentials" ON storage.objects;
DROP POLICY IF EXISTS "Platform admins can delete all credentials" ON storage.objects;

-- Step 2: Create new JWT-based policies (no table queries = no recursion)

-- Users can upload their own credentials
-- Path structure: /user-credentials/{user-id}/{filename}
CREATE POLICY "Users can upload own credentials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own credentials
CREATE POLICY "Users can view own credentials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own credentials
CREATE POLICY "Users can update own credentials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own credentials
CREATE POLICY "Users can delete own credentials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Platform admins can view all credentials
CREATE POLICY "Platform admins can view all credentials"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can update credentials (for verification purposes)
CREATE POLICY "Platform admins can update all credentials"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  )
  WITH CHECK (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Platform admins can delete credentials if needed
CREATE POLICY "Platform admins can delete all credentials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-credentials' AND
    (auth.jwt() ->> 'account_type') = 'platformAdmin'
  );

-- Step 3: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%credentials%'
ORDER BY policyname;

