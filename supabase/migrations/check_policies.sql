-- Check RLS policies for users and organizations tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'organizations')
ORDER BY tablename, policyname;

