-- =====================================================
-- Extend Organizations for Company Profile
-- Migration: 20260127000001
-- Description: Adds bio, organization_skills, and organization_benefits tables
-- =====================================================

-- =====================================================
-- STEP 1: ADD BIO FIELD TO ORGANIZATIONS
-- =====================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN public.organizations.bio IS 'Company bio/about section';

-- =====================================================
-- STEP 2: CREATE ORGANIZATION SKILLS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate skills per organization
  UNIQUE(organization_id, skill_id)
);

CREATE INDEX idx_organization_skills_organization_id ON public.organization_skills(organization_id);
CREATE INDEX idx_organization_skills_skill_id ON public.organization_skills(skill_id);

COMMENT ON TABLE public.organization_skills IS 'Skills that organizations require from their employees';

-- =====================================================
-- STEP 3: CREATE ORGANIZATION BENEFITS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  benefit_name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon name for UI (e.g., 'heart', 'dollar', 'calendar')
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organization_benefits_organization_id ON public.organization_benefits(organization_id);
CREATE INDEX idx_organization_benefits_sort_order ON public.organization_benefits(organization_id, sort_order);

COMMENT ON TABLE public.organization_benefits IS 'Company benefits offered by organizations';

-- =====================================================
-- STEP 4: ENABLE RLS ON NEW TABLES
-- =====================================================

ALTER TABLE public.organization_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_benefits ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: CREATE RLS POLICIES
-- =====================================================

-- Organization Skills Policies
CREATE POLICY "Anyone can view organization skills"
  ON public.organization_skills
  FOR SELECT
  USING (true);

CREATE POLICY "Organization admins can manage their organization skills"
  ON public.organization_skills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.organization_id = organization_skills.organization_id
      AND users.user_role IN ('org_admin', 'hr_manager')
    )
  );

CREATE POLICY "Platform admins can manage all organization skills"
  ON public.organization_skills
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role = 'super_admin'
    )
  );

-- Organization Benefits Policies
CREATE POLICY "Anyone can view organization benefits"
  ON public.organization_benefits
  FOR SELECT
  USING (true);

CREATE POLICY "Organization admins can manage their organization benefits"
  ON public.organization_benefits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.organization_id = organization_benefits.organization_id
      AND users.user_role IN ('org_admin', 'hr_manager')
    )
  );

CREATE POLICY "Platform admins can manage all organization benefits"
  ON public.organization_benefits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.user_role = 'super_admin'
    )
  );

