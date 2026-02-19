-- ============================================================
-- Fix handle_new_user Trigger to Respect User Metadata
-- Migration: 20260120000001
-- Description: Update the handle_new_user trigger to use account_type 
--              and user_role from user_metadata instead of hardcoding
-- ============================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================================
-- CREATE UPDATED TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert user record with values from auth.users metadata
  -- If metadata doesn't exist, default to personal/candidate
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    account_type, 
    user_role,
    organization_id,
    current_context
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'personal')::account_type,
    COALESCE(NEW.raw_user_meta_data->>'user_role', 'candidate')::user_role,
    (NEW.raw_user_meta_data->>'organization_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'current_context', 'personal')::user_context
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- RECREATE TRIGGER
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify the trigger was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE 'Trigger on_auth_user_created created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create trigger on_auth_user_created';
  END IF;
END $$;

