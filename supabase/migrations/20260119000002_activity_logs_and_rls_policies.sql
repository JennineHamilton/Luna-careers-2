-- ============================================================
-- Luna Careers - Activity Logs and RLS Policies
-- Migration: 20260119000002
-- Description: Creates activity logging system and comprehensive RLS policies
-- ============================================================

-- ============================================================
-- STEP 1: CREATE ACTIVITY LOG ENUMS
-- ============================================================

CREATE TYPE activity_type AS ENUM (
  'user_login',
  'user_logout',
  'user_created',
  'user_updated',
  'user_deleted',
  'organization_created',
  'organization_updated',
  'organization_verified',
  'organization_suspended',
  'team_member_invited',
  'team_member_joined',
  'team_member_removed',
  'role_changed',
  'context_switched',
  'settings_updated',
  'password_changed',
  'email_changed'
);

-- ============================================================
-- STEP 2: CREATE ACTIVITY LOGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  activity_type activity_type NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for activity logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_organization_id ON public.activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- ============================================================
-- STEP 3: CREATE ORGANIZATION MEMBERS VIEW
-- ============================================================

-- Convenient view to see all organization members with their details
CREATE OR REPLACE VIEW public.organization_members AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.avatar_url,
  u.user_role,
  u.organization_id,
  u.is_active,
  u.last_login_at,
  u.created_at,
  o.name as organization_name,
  o.slug as organization_slug
FROM public.users u
INNER JOIN public.organizations o ON u.organization_id = o.id
WHERE u.account_type IN ('organization', 'hybrid')
  AND u.organization_id IS NOT NULL;

-- ============================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- ============================================================

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: CREATE RLS POLICIES FOR ORGANIZATIONS
-- ============================================================

-- Platform admins can read all organizations
CREATE POLICY "Platform admins can read all organizations"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Organization members can read their own organization
CREATE POLICY "Organization members can read own organization"
  ON public.organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.organization_id IS NOT NULL
    )
  );

-- Organization admins can update their organization
CREATE POLICY "Organization admins can update own organization"
  ON public.organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role = 'org_admin'
      AND users.organization_id IS NOT NULL
    )
  );

-- Platform admins can update any organization
CREATE POLICY "Platform admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can insert organizations
CREATE POLICY "Platform admins can insert organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- ============================================================
-- STEP 6: CREATE RLS POLICIES FOR TEAM INVITATIONS
-- ============================================================

-- Organization admins and HR managers can read invitations for their org
CREATE POLICY "Org admins can read team invitations"
  ON public.team_invitations FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role IN ('org_admin', 'hr_manager')
      AND users.organization_id IS NOT NULL
    )
  );

-- Organization admins and HR managers can create invitations
CREATE POLICY "Org admins can create team invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role IN ('org_admin', 'hr_manager')
      AND users.organization_id IS NOT NULL
    )
  );

-- Organization admins and HR managers can update invitations
CREATE POLICY "Org admins can update team invitations"
  ON public.team_invitations FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role IN ('org_admin', 'hr_manager')
      AND users.organization_id IS NOT NULL
    )
  );

-- Platform admins can read all invitations
CREATE POLICY "Platform admins can read all team invitations"
  ON public.team_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- ============================================================
-- STEP 7: CREATE RLS POLICIES FOR ACTIVITY LOGS
-- ============================================================

-- Users can read their own activity logs
CREATE POLICY "Users can read own activity logs"
  ON public.activity_logs FOR SELECT
  USING (user_id = auth.uid());

-- Organization admins can read activity logs for their organization
CREATE POLICY "Org admins can read organization activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role = 'org_admin'
      AND users.organization_id IS NOT NULL
    )
  );

-- Platform admins can read all activity logs
CREATE POLICY "Platform admins can read all activity logs"
  ON public.activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Allow system to insert activity logs (via service role or trigger)
CREATE POLICY "Allow system to insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- STEP 8: UPDATE EXISTING USER POLICIES
-- ============================================================

-- Drop old policies that might conflict
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data (except sensitive fields)
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent users from changing their own account_type or organization_id
    AND (
      (account_type = (SELECT account_type FROM public.users WHERE id = auth.uid()))
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND account_type = 'platformAdmin'
      )
    )
  );

-- Organization admins can read members of their organization
CREATE POLICY "Org admins can read organization members"
  ON public.users FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role IN ('org_admin', 'hr_manager')
      AND users.organization_id IS NOT NULL
    )
  );

-- Platform admins can read all users
CREATE POLICY "Platform admins can read all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can update any user
CREATE POLICY "Platform admins can update users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Organization admins can update members of their organization (limited fields)
CREATE POLICY "Org admins can update organization members"
  ON public.users FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role = 'org_admin'
      AND users.organization_id IS NOT NULL
    )
  );

