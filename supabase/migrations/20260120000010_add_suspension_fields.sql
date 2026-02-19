-- ============================================================
-- Luna Careers - Add Suspension Fields
-- Migration: 20260120000010
-- Description: Adds suspension tracking fields to users table
-- ============================================================

-- ============================================================
-- STEP 1: Add suspension fields to users table
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- ============================================================
-- STEP 2: Create index for suspended users
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_is_suspended 
  ON public.users(is_suspended) 
  WHERE is_suspended = true;

-- ============================================================
-- STEP 3: Add comment for documentation
-- ============================================================

COMMENT ON COLUMN public.users.is_suspended IS 'Whether the user account is currently suspended';
COMMENT ON COLUMN public.users.suspension_reason IS 'Reason for suspension (required when suspending)';
COMMENT ON COLUMN public.users.suspended_at IS 'Timestamp when user was suspended';
COMMENT ON COLUMN public.users.suspended_by IS 'Admin user who suspended this account';

-- ============================================================
-- STEP 4: Update sync_user_metadata function to include suspension fields
-- ============================================================

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
    'last_name', NEW.last_name,
    'is_suspended', NEW.is_suspended,
    'suspension_reason', NEW.suspension_reason
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 5: Sync existing users' suspension status to JWT metadata
-- ============================================================

UPDATE auth.users au
SET raw_user_meta_data = jsonb_build_object(
  'account_type', u.account_type,
  'user_role', u.user_role,
  'organization_id', u.organization_id,
  'current_context', u.current_context,
  'first_name', u.first_name,
  'last_name', u.last_name,
  'is_suspended', u.is_suspended,
  'suspension_reason', u.suspension_reason
)
FROM public.users u
WHERE au.id = u.id;

