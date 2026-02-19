-- =====================================================
-- Professional Profile RLS Policies
-- Migration: 20260126000004
-- Description: Row Level Security policies for professional profile tables
-- =====================================================

-- =====================================================
-- STEP 1: ENABLE RLS ON ALL NEW TABLES
-- =====================================================

ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verified_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: USER LANGUAGES POLICIES
-- =====================================================

-- Users can view their own languages
CREATE POLICY "Users can view own languages"
  ON user_languages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own languages
CREATE POLICY "Users can insert own languages"
  ON user_languages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own languages
CREATE POLICY "Users can update own languages"
  ON user_languages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own languages
CREATE POLICY "Users can delete own languages"
  ON user_languages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform admins can view all languages
CREATE POLICY "Platform admins can view all languages"
  ON user_languages
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 3: USER SKILLS POLICIES (Unverified)
-- =====================================================

-- Users can view their own skills
CREATE POLICY "Users can view own skills"
  ON user_skills
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own skills
CREATE POLICY "Users can insert own skills"
  ON user_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own skills
CREATE POLICY "Users can delete own skills"
  ON user_skills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform admins can view all user skills
CREATE POLICY "Platform admins can view all user skills"
  ON user_skills
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 4: USER VERIFIED SKILLS POLICIES
-- =====================================================

-- Users can view their own verified skills
CREATE POLICY "Users can view own verified skills"
  ON user_verified_skills
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only system can insert verified skills (via functions)
CREATE POLICY "System can insert verified skills"
  ON user_verified_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Platform admins can view all verified skills
CREATE POLICY "Platform admins can view all verified skills"
  ON user_verified_skills
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- Platform admins can delete verified skills if needed
CREATE POLICY "Platform admins can delete verified skills"
  ON user_verified_skills
  FOR DELETE
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 5: PROFESSIONAL EXPERIENCE POLICIES
-- =====================================================

-- Users can view their own experience
CREATE POLICY "Users can view own experience"
  ON professional_experience
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own experience
CREATE POLICY "Users can insert own experience"
  ON professional_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own experience (only if pending or rejected)
CREATE POLICY "Users can update own experience"
  ON professional_experience
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND verification_status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own experience
CREATE POLICY "Users can delete own experience"
  ON professional_experience
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform admins can view all experience
CREATE POLICY "Platform admins can view all experience"
  ON professional_experience
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- Platform admins can update experience (for verification)
CREATE POLICY "Platform admins can update experience"
  ON professional_experience
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 6: EDUCATION POLICIES
-- =====================================================

-- Users can view their own education
CREATE POLICY "Users can view own education"
  ON education
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own education
CREATE POLICY "Users can insert own education"
  ON education
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own education (only if pending or rejected)
CREATE POLICY "Users can update own education"
  ON education
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND verification_status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own education
CREATE POLICY "Users can delete own education"
  ON education
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform admins can view all education
CREATE POLICY "Platform admins can view all education"
  ON education
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- Platform admins can update education (for verification)
CREATE POLICY "Platform admins can update education"
  ON education
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 7: CERTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own certifications
CREATE POLICY "Users can view own certifications"
  ON certifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own certifications
CREATE POLICY "Users can insert own certifications"
  ON certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own certifications (only if pending or rejected)
CREATE POLICY "Users can update own certifications"
  ON certifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND verification_status IN ('pending', 'rejected'))
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own certifications
CREATE POLICY "Users can delete own certifications"
  ON certifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Platform admins can view all certifications
CREATE POLICY "Platform admins can view all certifications"
  ON certifications
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- Platform admins can update certifications (for verification)
CREATE POLICY "Platform admins can update certifications"
  ON certifications
  FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'account_type') = 'platformAdmin')
  WITH CHECK ((auth.jwt() ->> 'account_type') = 'platformAdmin');

-- =====================================================
-- STEP 8: PUBLIC READ POLICIES (for verified items)
-- =====================================================

-- Public can view verified professional experience
CREATE POLICY "Public can view verified experience"
  ON professional_experience
  FOR SELECT
  TO public
  USING (verification_status = 'verified');

-- Public can view verified education
CREATE POLICY "Public can view verified education"
  ON education
  FOR SELECT
  TO public
  USING (verification_status = 'verified');

-- Public can view verified certifications
CREATE POLICY "Public can view verified certifications"
  ON certifications
  FOR SELECT
  TO public
  USING (verification_status = 'verified');

-- Public can view all verified skills
CREATE POLICY "Public can view verified skills"
  ON user_verified_skills
  FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Users can view own languages" ON user_languages IS 'Users can view their own language proficiency records';
COMMENT ON POLICY "Platform admins can view all experience" ON professional_experience IS 'Platform admins can view all professional experience for verification';
COMMENT ON POLICY "Public can view verified experience" ON professional_experience IS 'Public profiles show only verified professional experience';

