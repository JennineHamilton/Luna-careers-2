-- ============================================================
-- Luna Careers - Extended Schema for Users, Organizations, and Team Members
-- Migration: 20260119000001
-- Description: Extends the minimal auth schema with comprehensive user profiles,
--              organization details, and team member management
-- ============================================================

-- ============================================================
-- STEP 1: CREATE NEW ENUMS
-- ============================================================

-- Organization verification status
CREATE TYPE organization_verification_status AS ENUM (
  'pending',
  'verified',
  'rejected',
  'suspended'
);

-- Organization size categories
CREATE TYPE organization_size AS ENUM (
  'startup',      -- 1-10 employees
  'small',        -- 11-50 employees
  'medium',       -- 51-200 employees
  'large',        -- 201-1000 employees
  'enterprise'    -- 1000+ employees
);

-- Industry categories
CREATE TYPE industry_type AS ENUM (
  'technology',
  'healthcare',
  'finance',
  'education',
  'retail',
  'manufacturing',
  'hospitality',
  'construction',
  'transportation',
  'energy',
  'telecommunications',
  'media',
  'real_estate',
  'legal',
  'consulting',
  'nonprofit',
  'government',
  'other'
);

-- Team member invitation status
CREATE TYPE invitation_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);

-- ============================================================
-- STEP 2: EXTEND USERS TABLE
-- ============================================================

-- Add profile fields to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS resume_url TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Add indexes for new user fields
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON public.users(last_login_at);

-- ============================================================
-- STEP 3: EXTEND ORGANIZATIONS TABLE
-- ============================================================

-- Add comprehensive organization fields
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS industry industry_type,
  ADD COLUMN IF NOT EXISTS organization_size organization_size,
  ADD COLUMN IF NOT EXISTS founded_year INTEGER,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER,
  ADD COLUMN IF NOT EXISTS headquarters_location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS verification_status organization_verification_status DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Add indexes for organization fields
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_verification_status ON public.organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);

-- ============================================================
-- STEP 4: CREATE TEAM INVITATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  user_role user_role NOT NULL,
  invitation_token VARCHAR(255) UNIQUE NOT NULL,
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_pending_invitation UNIQUE (organization_id, email, status)
);

-- Add indexes for team invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_organization_id ON public.team_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at);

