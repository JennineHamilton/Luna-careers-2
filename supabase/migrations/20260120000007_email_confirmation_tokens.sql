-- ============================================================
-- Email Confirmation Tokens Table
-- Migration: 20260120000007
-- Description: Create table for storing email confirmation tokens for public signup
-- ============================================================

-- ============================================================
-- STEP 1: Create email_confirmation_tokens table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- ============================================================
-- STEP 2: Create indexes
-- ============================================================

CREATE INDEX idx_email_confirmation_tokens_user_id ON public.email_confirmation_tokens(user_id);
CREATE INDEX idx_email_confirmation_tokens_token ON public.email_confirmation_tokens(token);
CREATE INDEX idx_email_confirmation_tokens_expires_at ON public.email_confirmation_tokens(expires_at);

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================

ALTER TABLE public.email_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS policies
-- ============================================================

-- Only allow service role to manage tokens (no user access)
CREATE POLICY "Service role can manage email confirmation tokens"
  ON public.email_confirmation_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- STEP 5: Create function to clean up expired tokens
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_confirmation_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.email_confirmation_tokens
  WHERE expires_at < NOW() AND used_at IS NULL;
END;
$$;

-- ============================================================
-- STEP 6: Grant permissions
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_confirmation_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_confirmation_tokens() TO service_role;

