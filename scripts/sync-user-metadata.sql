-- ============================================================
-- Sync User Metadata to JWT
-- ============================================================
-- This script manually syncs user data from public.users to auth.users metadata
-- Run this if your JWT doesn't have the latest account_type
-- ============================================================

-- Sync all users' metadata
UPDATE auth.users au
SET raw_user_meta_data = jsonb_build_object(
  'account_type', u.account_type,
  'user_role', u.user_role,
  'organization_id', u.organization_id,
  'current_context', u.current_context,
  'first_name', u.first_name,
  'last_name', u.last_name,
  'is_suspended', COALESCE(u.is_suspended, false),
  'suspension_reason', u.suspension_reason
)
FROM public.users u
WHERE au.id = u.id;

-- Verify the sync (replace with your email)
SELECT 
  au.email,
  au.raw_user_meta_data->>'account_type' as jwt_account_type,
  u.account_type as db_account_type,
  au.raw_user_meta_data->>'user_role' as jwt_user_role,
  u.user_role as db_user_role
FROM auth.users au
JOIN public.users u ON au.id = u.id
WHERE au.email = 'your-email@example.com';

-- ============================================================
-- IMPORTANT: After running this script
-- ============================================================
-- 1. Log out of the application
-- 2. Log back in (this will get a fresh JWT with updated metadata)
-- 3. The JWT will now have the correct account_type
-- ============================================================

