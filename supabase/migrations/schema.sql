-- Luna Careers Database Schema (Minimal - Auth Focus)
-- ============================================================
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: CLEAN UP (drop existing objects if re-running)
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_context CASCADE;
DROP TYPE IF EXISTS account_type CASCADE;

-- ============================================================
-- STEP 2: CREATE ENUMS (must be created before tables)
-- ============================================================

CREATE TYPE account_type AS ENUM (
  'personal',
  'organization',
  'platformAdmin',
  'hybrid'
);

CREATE TYPE user_context AS ENUM (
  'personal',
  'organization'
);

CREATE TYPE user_role AS ENUM (
  'candidate',
  'premium_member',
  'organization_member',
  'recruiter',
  'hr_manager',
  'hiring_manager',
  'org_admin',
  'super_admin',
  'moderator',
  'support'
);

-- ============================================================
-- STEP 3: CREATE TABLES
-- ============================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  account_type account_type NOT NULL DEFAULT 'personal',
  user_role user_role NOT NULL DEFAULT 'candidate',
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  current_context user_context DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 4: CREATE INDEXES
-- ============================================================

CREATE INDEX idx_users_account_type ON public.users(account_type);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_organization_id ON public.users(organization_id);

-- ============================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================

-- Users can read their own data
CREATE POLICY "Users can read own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Allow insert for the trigger (runs as SECURITY DEFINER)
CREATE POLICY "Allow trigger insert"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Organization members can read their organization
CREATE POLICY "Org members can read their org"
  ON public.organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- STEP 7: CREATE TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, account_type, user_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'personal',
    'candidate'
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 8: CREATE TRIGGER
-- ============================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
