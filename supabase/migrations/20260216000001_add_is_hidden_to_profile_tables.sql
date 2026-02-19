-- =====================================================
-- Add is_hidden field to professional profile tables
-- Migration: 20260216000001
-- Description: Allows users to hide verified items from their profile without losing verification
-- =====================================================

-- Add is_hidden column to professional_experience
ALTER TABLE professional_experience
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add is_hidden column to education
ALTER TABLE education
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add is_hidden column to certifications
ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_professional_experience_is_hidden ON professional_experience(user_id, is_hidden);
CREATE INDEX IF NOT EXISTS idx_education_is_hidden ON education(user_id, is_hidden);
CREATE INDEX IF NOT EXISTS idx_certifications_is_hidden ON certifications(user_id, is_hidden);

-- =====================================================
-- Update RLS Policies to allow toggling is_hidden
-- =====================================================

-- Drop existing update policies for professional_experience
DROP POLICY IF EXISTS "Users can update own experience" ON professional_experience;

-- Create new update policy that allows updating is_hidden for verified items
-- Note: We allow updates for verified items, but the API layer will enforce that only is_hidden can be changed
CREATE POLICY "Users can update own experience"
  ON professional_experience
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing update policies for education
DROP POLICY IF EXISTS "Users can update own education" ON education;

-- Create new update policy that allows updating is_hidden for verified items
-- Note: We allow updates for verified items, but the API layer will enforce that only is_hidden can be changed
CREATE POLICY "Users can update own education"
  ON education
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop existing update policies for certifications
DROP POLICY IF EXISTS "Users can update own certifications" ON certifications;

-- Create new update policy that allows updating is_hidden for verified items
-- Note: We allow updates for verified items, but the API layer will enforce that only is_hidden can be changed
CREATE POLICY "Users can update own certifications"
  ON certifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Update public read policies to exclude hidden items
-- =====================================================

-- Drop existing public read policies
DROP POLICY IF EXISTS "Public can view verified experience" ON professional_experience;
DROP POLICY IF EXISTS "Public can view verified education" ON education;
DROP POLICY IF EXISTS "Public can view verified certifications" ON certifications;

-- Create new public read policies that exclude hidden items
CREATE POLICY "Public can view verified experience"
  ON professional_experience
  FOR SELECT
  TO public
  USING (verification_status = 'verified' AND is_hidden = false);

CREATE POLICY "Public can view verified education"
  ON education
  FOR SELECT
  TO public
  USING (verification_status = 'verified' AND is_hidden = false);

CREATE POLICY "Public can view verified certifications"
  ON certifications
  FOR SELECT
  TO public
  USING (verification_status = 'verified' AND is_hidden = false);

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON COLUMN professional_experience.is_hidden IS 'Allows users to hide verified items from their profile without losing verification';
COMMENT ON COLUMN education.is_hidden IS 'Allows users to hide verified items from their profile without losing verification';
COMMENT ON COLUMN certifications.is_hidden IS 'Allows users to hide verified items from their profile without losing verification';

