-- ============================================================
-- Luna Careers - Helper Functions and Triggers
-- Migration: 20260119000003
-- Description: Creates utility functions and triggers for automation
-- ============================================================

-- ============================================================
-- STEP 1: CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 2: ADD UPDATED_AT TRIGGERS TO TABLES
-- ============================================================

-- Users table
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Organizations table
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Team invitations table
DROP TRIGGER IF EXISTS update_team_invitations_updated_at ON public.team_invitations;
CREATE TRIGGER update_team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- STEP 3: CREATE ACTIVITY LOG HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id UUID,
  p_organization_id UUID,
  p_activity_type activity_type,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    organization_id,
    activity_type,
    description,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_activity_type,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- ============================================================
-- STEP 4: CREATE ORGANIZATION SLUG GENERATOR
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_organization_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Limit length to 80 characters
  base_slug := substring(base_slug from 1 for 80);
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- ============================================================
-- STEP 5: CREATE AUTO-SLUG TRIGGER FOR ORGANIZATIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_organization_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_organization_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_organization_slug_trigger ON public.organizations;
CREATE TRIGGER set_organization_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_slug();

-- ============================================================
-- STEP 6: CREATE INVITATION TOKEN GENERATOR
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 32-character token
  token := encode(gen_random_bytes(24), 'base64');
  -- Remove special characters that might cause URL issues
  token := replace(replace(replace(token, '+', ''), '/', ''), '=', '');
  RETURN token;
END;
$$;

-- ============================================================
-- STEP 7: CREATE TEAM INVITATION HELPER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_team_invitation(
  p_organization_id UUID,
  p_invited_by UUID,
  p_email VARCHAR(255),
  p_user_role user_role,
  p_expires_in_days INTEGER DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_id UUID;
  v_token TEXT;
BEGIN
  -- Generate unique token
  v_token := public.generate_invitation_token();
  
  -- Create invitation
  INSERT INTO public.team_invitations (
    organization_id,
    invited_by,
    email,
    user_role,
    invitation_token,
    expires_at
  ) VALUES (
    p_organization_id,
    p_invited_by,
    p_email,
    p_user_role,
    v_token,
    NOW() + (p_expires_in_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_invitation_id;
  
  -- Log activity
  PERFORM public.log_activity(
    p_invited_by,
    p_organization_id,
    'team_member_invited',
    'Invited ' || p_email || ' to join as ' || p_user_role,
    jsonb_build_object('email', p_email, 'role', p_user_role)
  );
  
  RETURN v_invitation_id;
END;
$$;

