-- Vacancies System Migration
-- Creates tables for job vacancies and job applications

-- ============================================================
-- ENUMS
-- ============================================================

-- Employment type enum
DO $$ BEGIN
  CREATE TYPE employment_type AS ENUM ('full-time', 'part-time', 'contract', 'internship', 'temporary');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Experience level enum
DO $$ BEGIN
  CREATE TYPE experience_level AS ENUM ('entry', 'mid', 'senior', 'lead', 'executive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Job application status enum
DO $$ BEGIN
  CREATE TYPE job_application_status AS ENUM ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TABLES
-- ============================================================

-- Vacancies table
CREATE TABLE IF NOT EXISTS public.vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Basic information
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Location
  location_country VARCHAR(100),
  location_state VARCHAR(100),
  location_city VARCHAR(100),
  is_remote BOOLEAN DEFAULT false,
  
  -- Job details
  employment_type employment_type NOT NULL,
  experience_level experience_level NOT NULL,
  
  -- Salary
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Skills and benefits
  required_skills JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  
  -- Application settings
  application_deadline TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vacancy_id UUID NOT NULL REFERENCES public.vacancies(id) ON DELETE CASCADE,
  
  -- Application data
  status job_application_status NOT NULL DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  application_data JSONB DEFAULT '{}'::jsonb, -- Additional questions/answers
  
  -- Review information
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  
  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate applications
  UNIQUE(user_id, vacancy_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Vacancies indexes
CREATE INDEX IF NOT EXISTS idx_vacancies_organization ON public.vacancies(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_is_active ON public.vacancies(is_active);
CREATE INDEX IF NOT EXISTS idx_vacancies_employment_type ON public.vacancies(employment_type);
CREATE INDEX IF NOT EXISTS idx_vacancies_experience_level ON public.vacancies(experience_level);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_at ON public.vacancies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vacancies_deadline ON public.vacancies(application_deadline);

-- Job applications indexes
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy ON public.job_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_at ON public.job_applications(applied_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at for vacancies
CREATE OR REPLACE FUNCTION update_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vacancies_updated_at_trigger
BEFORE UPDATE ON public.vacancies
FOR EACH ROW
EXECUTE FUNCTION update_vacancies_updated_at();

-- Auto-update updated_at for job_applications
CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_applications_updated_at_trigger
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- VACANCIES RLS POLICIES
-- ============================================================

-- Public can read active vacancies
CREATE POLICY "Public can read active vacancies"
ON public.vacancies
FOR SELECT
USING (is_active = true);

-- Organization admins can read their own vacancies (including inactive)
CREATE POLICY "Organization admins can read their own vacancies"
ON public.vacancies
FOR SELECT
USING (
  organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
);

-- Organization admins can create vacancies for their organization
CREATE POLICY "Organization admins can create vacancies"
ON public.vacancies
FOR INSERT
WITH CHECK (
  organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
);

-- Organization admins can update their own vacancies
CREATE POLICY "Organization admins can update their own vacancies"
ON public.vacancies
FOR UPDATE
USING (
  organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
);

-- Organization admins can delete their own vacancies
CREATE POLICY "Organization admins can delete their own vacancies"
ON public.vacancies
FOR DELETE
USING (
  organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
);

-- ============================================================
-- JOB APPLICATIONS RLS POLICIES
-- ============================================================

-- Users can read their own applications
CREATE POLICY "Users can read their own applications"
ON public.job_applications
FOR SELECT
USING (user_id = auth.uid());

-- Users can create their own applications
CREATE POLICY "Users can create applications"
ON public.job_applications
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own applications (e.g., withdraw)
CREATE POLICY "Users can update their own applications"
ON public.job_applications
FOR UPDATE
USING (user_id = auth.uid());

-- Organization admins can read applications for their vacancies
CREATE POLICY "Organization admins can read applications for their vacancies"
ON public.job_applications
FOR SELECT
USING (
  vacancy_id IN (
    SELECT id FROM public.vacancies
    WHERE organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
  )
);

-- Organization admins can update applications for their vacancies (review, status change)
CREATE POLICY "Organization admins can update applications for their vacancies"
ON public.job_applications
FOR UPDATE
USING (
  vacancy_id IN (
    SELECT id FROM public.vacancies
    WHERE organization_id::text = (auth.jwt()->>'user_metadata')::jsonb->>'organization_id'
  )
);

