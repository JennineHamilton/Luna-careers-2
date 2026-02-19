-- =====================================================
-- Professional Profile and Verification System
-- Migration: 20260126000003
-- Description: Adds comprehensive professional profile fields and admin verification workflow
--              for user credentials including languages, skills, experience, education, and certifications
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS
-- =====================================================

-- Verification status for credentials
CREATE TYPE verification_status AS ENUM (
  'pending',
  'verified',
  'rejected'
);

-- Language proficiency levels
CREATE TYPE language_proficiency AS ENUM (
  'native',
  'fluent',
  'advanced',
  'intermediate',
  'basic'
);

-- Education levels
CREATE TYPE education_level AS ENUM (
  'high_school',
  'associate',
  'bachelor',
  'master',
  'phd'
);

-- Skill source types for verified skills
CREATE TYPE skill_source_type AS ENUM (
  'learning_completion',
  'assessment_passed'
);

-- =====================================================
-- STEP 2: EXTEND USERS TABLE
-- =====================================================

-- Add new location fields and intro video
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country VARCHAR(100),
  ADD COLUMN IF NOT EXISTS intro_video_url TEXT;

-- Add comment
COMMENT ON COLUMN public.users.intro_video_url IS 'User introduction video URL';
COMMENT ON COLUMN public.users.city IS 'User city (extracted from location)';
COMMENT ON COLUMN public.users.state IS 'User state/province (extracted from location)';
COMMENT ON COLUMN public.users.country IS 'User country (extracted from location)';

-- =====================================================
-- STEP 3: CREATE USER LANGUAGES TABLE
-- =====================================================

CREATE TABLE user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  language_name VARCHAR(100) NOT NULL,
  proficiency_level language_proficiency NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate languages per user
  UNIQUE(user_id, language_name)
);

CREATE INDEX idx_user_languages_user_id ON user_languages(user_id);

COMMENT ON TABLE user_languages IS 'User language proficiency records';

-- =====================================================
-- STEP 4: CREATE USER SKILLS TABLE (Unverified)
-- =====================================================

CREATE TABLE user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate skills per user
  UNIQUE(user_id, skill_id)
);

CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);

COMMENT ON TABLE user_skills IS 'User-selected skills (unverified)';

-- =====================================================
-- STEP 5: CREATE USER VERIFIED SKILLS TABLE
-- =====================================================

CREATE TABLE user_verified_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  source_type skill_source_type NOT NULL,
  source_id UUID NOT NULL, -- References completion or assessment record
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate verified skills per user per source
  UNIQUE(user_id, skill_id, source_type, source_id)
);

CREATE INDEX idx_user_verified_skills_user_id ON user_verified_skills(user_id);
CREATE INDEX idx_user_verified_skills_skill_id ON user_verified_skills(skill_id);
CREATE INDEX idx_user_verified_skills_source ON user_verified_skills(source_type, source_id);

COMMENT ON TABLE user_verified_skills IS 'Auto-verified skills from learning completions and assessments';

-- =====================================================
-- STEP 6: CREATE PROFESSIONAL EXPERIENCE TABLE
-- =====================================================

CREATE TABLE professional_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  description TEXT,
  location_country VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  currently_working BOOLEAN DEFAULT false,
  
  -- Verification fields
  verification_status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: end_date must be after start_date
  CONSTRAINT check_experience_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_professional_experience_user_id ON professional_experience(user_id);
CREATE INDEX idx_professional_experience_verification_status ON professional_experience(verification_status);
CREATE INDEX idx_professional_experience_verified_by ON professional_experience(verified_by);

COMMENT ON TABLE professional_experience IS 'User professional work experience with admin verification';

-- =====================================================
-- STEP 7: CREATE EDUCATION TABLE
-- =====================================================

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution VARCHAR(255) NOT NULL,
  education_level education_level NOT NULL,
  field_of_study VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  currently_enrolled BOOLEAN DEFAULT false,
  certificate_url TEXT, -- Uploaded certificate/diploma

  -- Verification fields
  verification_status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: end_date must be after start_date
  CONSTRAINT check_education_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_education_user_id ON education(user_id);
CREATE INDEX idx_education_verification_status ON education(verification_status);
CREATE INDEX idx_education_verified_by ON education(verified_by);
CREATE INDEX idx_education_level ON education(education_level);

COMMENT ON TABLE education IS 'User formal education records with admin verification';

-- =====================================================
-- STEP 8: CREATE CERTIFICATIONS TABLE
-- =====================================================

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_title VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  does_not_expire BOOLEAN DEFAULT false,
  certificate_id VARCHAR(255), -- External certificate ID
  certificate_url_external TEXT, -- External verification URL
  certificate_file_url TEXT, -- Uploaded certificate file

  -- Verification fields
  verification_status verification_status DEFAULT 'pending',
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: expiry_date must be after issue_date
  CONSTRAINT check_certification_dates CHECK (expiry_date IS NULL OR expiry_date >= issue_date),
  -- Constraint: if does_not_expire is true, expiry_date must be null
  CONSTRAINT check_certification_expiry CHECK (NOT does_not_expire OR expiry_date IS NULL)
);

CREATE INDEX idx_certifications_user_id ON certifications(user_id);
CREATE INDEX idx_certifications_verification_status ON certifications(verification_status);
CREATE INDEX idx_certifications_verified_by ON certifications(verified_by);
CREATE INDEX idx_certifications_expiry_date ON certifications(expiry_date);

COMMENT ON TABLE certifications IS 'User professional certifications and training with admin verification';

-- =====================================================
-- STEP 9: CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Trigger function for updated_at (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER update_user_languages_updated_at
  BEFORE UPDATE ON user_languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professional_experience_updated_at
  BEFORE UPDATE ON professional_experience
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at
  BEFORE UPDATE ON education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
  BEFORE UPDATE ON certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 10: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TYPE verification_status IS 'Status for credential verification: pending, verified, rejected';
COMMENT ON TYPE language_proficiency IS 'Language proficiency levels: native, fluent, advanced, intermediate, basic';
COMMENT ON TYPE education_level IS 'Education levels: high_school, associate, bachelor, master, phd';
COMMENT ON TYPE skill_source_type IS 'Source of verified skills: learning_completion, assessment_passed';

