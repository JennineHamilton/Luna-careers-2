-- ============================================================
-- Add Custom Access Token Hook
-- Migration: 20260120000005
-- Description: Inject user metadata into JWT claims for RLS policies
-- ============================================================

-- ============================================================
-- STEP 1: Create custom access token hook function
-- ============================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_metadata jsonb;
BEGIN
  -- Get the claims from the event
  claims := event->'claims';
  
  -- Get user metadata from auth.users
  SELECT raw_user_meta_data INTO user_metadata
  FROM auth.users
  WHERE id = (event->>'user_id')::uuid;
  
  -- Inject custom claims from user_metadata
  IF user_metadata IS NOT NULL THEN
    claims := jsonb_set(claims, '{account_type}', to_jsonb(user_metadata->>'account_type'));
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_metadata->>'user_role'));
    claims := jsonb_set(claims, '{organization_id}', to_jsonb(user_metadata->>'organization_id'));
    claims := jsonb_set(claims, '{current_context}', to_jsonb(user_metadata->>'current_context'));
  END IF;
  
  -- Update the event with new claims
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- ============================================================
-- STEP 2: Grant necessary permissions
-- ============================================================

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

-- ============================================================
-- STEP 3: Instructions for enabling the hook
-- ============================================================

-- NOTE: You need to enable this hook in your Supabase Dashboard:
-- 1. Go to Database → Hooks
-- 2. Create a new hook with:
--    - Hook name: custom_access_token_hook
--    - Table: auth.users
--    - Events: INSERT, UPDATE
--    - Type: Custom Access Token
--    - Function: public.custom_access_token_hook

-- OR run this SQL in the Supabase SQL Editor:
-- This requires superuser access, so it might not work in the dashboard

DO $$
BEGIN
  -- Check if pg_net extension is available (needed for hooks)
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'supabase_vault') THEN
    RAISE NOTICE 'Custom access token hook function created successfully';
    RAISE NOTICE 'You need to enable it in the Supabase Dashboard under Database → Hooks';
    RAISE NOTICE 'Or contact Supabase support to enable it via SQL';
  END IF;
END $$;

