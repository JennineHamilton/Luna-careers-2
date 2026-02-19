-- ============================================================
-- Update User to Platform Admin
-- ============================================================
-- This script updates a user to have platformAdmin account_type
-- and super_admin role for accessing the /cmd/* portal
--
-- USAGE:
-- 1. Replace 'your-email@example.com' with your actual email
-- 2. Run this in Supabase SQL Editor
-- ============================================================

-- First, check current user data
SELECT 
  id,
  email,
  account_type,
  user_role,
  organization_id,
  current_context,
  created_at
FROM public.users
WHERE email = 'your-email@example.com';

-- Update user to platform admin
UPDATE public.users
SET 
  account_type = 'platformAdmin',
  user_role = 'super_admin',
  organization_id = NULL,  -- Platform admins don't belong to organizations
  current_context = NULL,  -- Platform admins don't have context
  updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT 
  id,
  email,
  account_type,
  user_role,
  organization_id,
  current_context,
  updated_at
FROM public.users
WHERE email = 'your-email@example.com';

-- ============================================================
-- IMPORTANT: After running this script
-- ============================================================
-- 1. Log out of the application
-- 2. Log back in
-- 3. You should now be redirected to /cmd/dashboard
-- ============================================================

