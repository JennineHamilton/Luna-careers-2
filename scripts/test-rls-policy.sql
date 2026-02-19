-- =====================================================
-- TEST RLS POLICY FOR USER CREDENTIALS
-- =====================================================
-- This script tests if the RLS policy logic is correct
--
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- You can get your user ID from the profile page or by running:
-- SELECT auth.uid();

-- Test 1: Check if storage.foldername works correctly
SELECT 
  'Test Path' AS test,
  'YOUR_USER_ID_HERE/intro-video-123.mp4' AS path,
  (storage.foldername('YOUR_USER_ID_HERE/intro-video-123.mp4'))[1] AS extracted_folder,
  'YOUR_USER_ID_HERE' AS expected_user_id,
  (storage.foldername('YOUR_USER_ID_HERE/intro-video-123.mp4'))[1] = 'YOUR_USER_ID_HERE' AS should_match;

-- Test 2: Check current user's auth.uid()
SELECT 
  auth.uid() AS current_user_id,
  auth.uid()::text AS current_user_id_text;

-- Test 3: Simulate the RLS policy check
-- This shows what the policy will evaluate to
SELECT 
  'user-credentials' AS bucket_id,
  'YOUR_USER_ID_HERE/intro-video-123.mp4' AS test_path,
  (storage.foldername('YOUR_USER_ID_HERE/intro-video-123.mp4'))[1] AS folder,
  auth.uid()::text AS current_user,
  (
    'user-credentials' = 'user-credentials' AND
    (storage.foldername('YOUR_USER_ID_HERE/intro-video-123.mp4'))[1] = auth.uid()::text
  ) AS policy_would_allow;

-- Test 4: Check if there are any other conflicting policies
SELECT
  policyname,
  cmd,
  qual AS using_clause,
  with_check AS with_check_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (
    policyname LIKE '%credentials%' OR
    qual::text LIKE '%user-credentials%' OR
    with_check::text LIKE '%user-credentials%'
  )
ORDER BY cmd, policyname;

