-- ============================================================
-- Fix Infinite Recursion in RLS Policies
-- Migration: 20260119000008
-- Description: Fix the sync_user_metadata trigger to avoid RLS recursion
-- ============================================================

-- ============================================================
-- STEP 1: Recreate sync_user_metadata function with proper security
-- ============================================================

DROP FUNCTION IF EXISTS public.sync_user_metadata() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update auth.users metadata when public.users changes
  -- Using SECURITY DEFINER allows this to bypass RLS
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_build_object(
    'account_type', NEW.account_type,
    'user_role', NEW.user_role,
    'organization_id', NEW.organization_id,
    'current_context', NEW.current_context,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_user_metadata_trigger ON public.users;
CREATE TRIGGER sync_user_metadata_trigger
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_metadata();

-- ============================================================
-- STEP 2: Add missing 'size' column to organizations table
-- ============================================================

-- Check if column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations' 
    AND column_name = 'size'
  ) THEN
    ALTER TABLE public.organizations 
    ADD COLUMN size VARCHAR(50);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.organizations.size IS 'Organization size (e.g., 1-10, 11-50, 51-200, 201-500, 500+)';

