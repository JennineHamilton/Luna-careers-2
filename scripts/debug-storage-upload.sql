-- =====================================================
-- DEBUG STORAGE UPLOAD ISSUE
-- =====================================================
-- This script helps debug why the RLS policy is failing
--
-- Run this in Supabase SQL Editor to check current state

-- 1. Check bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 AS size_limit_mb,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'user-credentials';

-- 2. Check all RLS policies for storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%credentials%'
ORDER BY cmd, policyname;

-- 3. Test the RLS policy logic manually
-- Replace 'YOUR_USER_ID' with your actual user ID
DO $$
DECLARE
  test_user_id TEXT := 'YOUR_USER_ID'; -- Replace with actual user ID
  test_path TEXT := test_user_id || '/intro-video-123.mp4';
  folder_name TEXT;
BEGIN
  -- Extract folder name using storage.foldername
  SELECT (storage.foldername(test_path))[1] INTO folder_name;
  
  RAISE NOTICE 'Test Path: %', test_path;
  RAISE NOTICE 'Extracted Folder: %', folder_name;
  RAISE NOTICE 'User ID: %', test_user_id;
  RAISE NOTICE 'Match: %', (folder_name = test_user_id);
END $$;

-- 4. Check if RLS is enabled on storage.objects
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

