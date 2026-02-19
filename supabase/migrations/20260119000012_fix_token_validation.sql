-- ============================================================
-- Fix invitation token validation
-- Don't mark token as used during validation, only after password is set
-- ============================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.validate_invitation_token(TEXT, TEXT) CASCADE;

-- Recreate function WITHOUT marking token as used
CREATE FUNCTION public.validate_invitation_token(
  p_token TEXT,
  p_temporary_password TEXT
)
RETURNS TABLE (
  valid BOOLEAN,
  user_id UUID,
  email VARCHAR(255)
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
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;

  -- Validate temporary password
  IF v_token_record.temporary_password != p_temporary_password THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::VARCHAR(255);
    RETURN;
  END IF;

  -- Get user info
  SELECT * INTO v_user_record
  FROM public.users
  WHERE id = v_token_record.user_id;

  -- DON'T mark token as used yet - that happens after password is set

  -- Return success
  RETURN QUERY SELECT true, v_user_record.id, v_user_record.email;
END;
$$;

-- Create new function to mark token as used (called after password is set)
CREATE OR REPLACE FUNCTION public.mark_invitation_token_used(
  p_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark token as used
  UPDATE public.invitation_tokens
  SET used_at = NOW()
  WHERE token = p_token
    AND used_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_invitation_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_token_used TO anon, authenticated, service_role;

