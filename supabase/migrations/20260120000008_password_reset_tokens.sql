-- ============================================================
-- Luna Careers - Password Reset Tokens Table
-- Migration: 20260120000008
-- Description: Creates table for storing password reset tokens
--              Used for custom password reset flow via MailGun
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT token_not_expired CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Service role can manage password reset tokens"
  ON public.password_reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No user access - only service role can manage these tokens

