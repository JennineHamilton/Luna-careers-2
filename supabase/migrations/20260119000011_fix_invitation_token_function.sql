-- ============================================================
-- Fix invitation token generation function
-- Use gen_random_uuid() instead of gen_random_bytes()
-- ============================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.generate_invitation_token(UUID, TEXT) CASCADE;

-- Recreate function with gen_random_uuid() which is built-in
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
  -- Generate a secure random token using gen_random_uuid()
  -- Convert UUID to base64-like string by removing hyphens and encoding
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires_at := NOW() + INTERVAL '7 days';

  -- Insert the token
  INSERT INTO public.invitation_tokens (user_id, token, temporary_password, expires_at)
  VALUES (p_user_id, v_token, p_temporary_password, v_expires_at);

  -- Return the token and expiry
  RETURN QUERY SELECT v_token, v_expires_at;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.generate_invitation_token TO authenticated, service_role;

