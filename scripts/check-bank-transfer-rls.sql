-- Check RLS status and policies for bank_transfer_submissions table

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'bank_transfer_submissions';

-- Check existing policies
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
WHERE tablename = 'bank_transfer_submissions';

-- Check actual data in the table
SELECT 
  id,
  user_id,
  status,
  submitted_at
FROM bank_transfer_submissions
ORDER BY submitted_at DESC
LIMIT 5;

