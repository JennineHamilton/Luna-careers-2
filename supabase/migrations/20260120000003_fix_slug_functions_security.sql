-- ============================================================
-- Fix Organization Slug Functions Security
-- Migration: 20260120000003
-- Description: Add SECURITY DEFINER to slug generation functions
--              to bypass RLS when checking for slug uniqueness
-- ============================================================

-- ============================================================
-- STEP 1: Recreate generate_organization_slug with SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_organization_slug(org_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
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
  -- This SELECT now bypasses RLS because of SECURITY DEFINER
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- ============================================================
-- STEP 2: Recreate set_organization_slug with SECURITY DEFINER
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_organization_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- This allows the trigger to bypass RLS
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_organization_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 3: Recreate the trigger (just to be safe)
-- ============================================================

DROP TRIGGER IF EXISTS set_organization_slug_trigger ON public.organizations;
CREATE TRIGGER set_organization_slug_trigger
  BEFORE INSERT OR UPDATE OF name ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_slug();

-- ============================================================
-- STEP 4: Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'Organization slug functions updated with SECURITY DEFINER';
  RAISE NOTICE 'This allows slug generation to bypass RLS when checking uniqueness';
END $$;

