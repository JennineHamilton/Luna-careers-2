-- ============================================================
-- Invitation System for User Onboarding
-- Migration: 20260119000006
-- Description: Adds invitation tracking and temporary password support
-- ============================================================

-- ============================================================
-- STEP 1: ADD INVITATION FIELDS TO USERS TABLE
-- ============================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS temporary_password_hash TEXT,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ;

-- Add indexes for invitation tracking
CREATE INDEX IF NOT EXISTS idx_users_invitation_sent_at ON public.users(invitation_sent_at);
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users(invited_by);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON public.users(onboarding_completed);

-- ============================================================
-- STEP 2: CREATE INVITATION TOKENS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.invitation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  temporary_password TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_token UNIQUE (user_id, token)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_user_id ON public.invitation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON public.invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires_at ON public.invitation_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read invitation tokens
CREATE POLICY "Platform admins can read invitation tokens"
  ON public.invitation_tokens FOR SELECT
  TO authenticated
  USING ((auth.jwt()->>'account_type') = 'platformAdmin');

-- System can insert tokens (via service role)
CREATE POLICY "System can insert invitation tokens"
  ON public.invitation_tokens FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================
-- STEP 3: CREATE HELPER FUNCTION TO GENERATE INVITATION TOKEN
-- ============================================================

-- Drop ALL existing versions of the function
DO $$
BEGIN
  -- Drop all overloaded versions
  DROP FUNCTION IF EXISTS public.generate_invitation_token(UUID, TEXT) CASCADE;
  DROP FUNCTION IF EXISTS public.generate_invitation_token(UUID) CASCADE;
  DROP FUNCTION IF EXISTS public.generate_invitation_token() CASCADE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE FUNCTION public.generate_invitation_token(
  p_user_id UUID,
  p_temporary_password TEXT
)
RETURNS TABLE (
  token TEXT,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Generate a secure random token
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Insert the token
  INSERT INTO public.invitation_tokens (user_id, token, temporary_password, expires_at)
  VALUES (p_user_id, v_token, p_temporary_password, v_expires_at);

  -- Return the token and expiry
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$;

-- ============================================================
-- STEP 4: CREATE FUNCTION TO VALIDATE INVITATION TOKEN
-- ============================================================

-- Drop ALL existing versions of the function
DO $$
BEGIN
  DROP FUNCTION IF EXISTS public.validate_invitation_token(TEXT, TEXT) CASCADE;
  DROP FUNCTION IF EXISTS public.validate_invitation_token(TEXT) CASCADE;
  DROP FUNCTION IF EXISTS public.validate_invitation_token() CASCADE;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE FUNCTION public.validate_invitation_token(
  p_token TEXT,
  p_temporary_password TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_user_record RECORD;
BEGIN
  -- Find the token
  SELECT * INTO v_token_record
  FROM public.invitation_tokens
  WHERE token = p_token
    AND used_at IS NULL
    AND expires_at > NOW();
  
  -- If token not found or expired
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Validate temporary password
  IF v_token_record.temporary_password != p_temporary_password THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;
  
  -- Get user info
  SELECT * INTO v_user_record
  FROM public.users
  WHERE id = v_token_record.user_id;
  
  -- Mark token as used
  UPDATE public.invitation_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;
  
  -- Return success
  RETURN QUERY SELECT true, v_user_record.id, v_user_record.email;
END;
$$;

-- ============================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================

GRANT EXECUTE ON FUNCTION public.generate_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_token TO anon, authenticated;

