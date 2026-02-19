-- =====================================================
-- Fix Knowledge Assessment Delete Policies
-- =====================================================
-- This migration fixes RLS policies to allow platform admins
-- to properly delete knowledge assessments and questions

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage knowledge assessments" ON knowledge_assessments;
DROP POLICY IF EXISTS "Admins can manage knowledge questions" ON knowledge_questions;
DROP POLICY IF EXISTS "Admins can manage knowledge question options" ON knowledge_question_options;

-- Drop new policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Platform admins can view all knowledge assessments" ON knowledge_assessments;
DROP POLICY IF EXISTS "Platform admins can create knowledge assessments" ON knowledge_assessments;
DROP POLICY IF EXISTS "Platform admins can update knowledge assessments" ON knowledge_assessments;
DROP POLICY IF EXISTS "Platform admins can delete knowledge assessments" ON knowledge_assessments;
DROP POLICY IF EXISTS "Platform admins can view all knowledge questions" ON knowledge_questions;
DROP POLICY IF EXISTS "Platform admins can create knowledge questions" ON knowledge_questions;
DROP POLICY IF EXISTS "Platform admins can update knowledge questions" ON knowledge_questions;
DROP POLICY IF EXISTS "Platform admins can delete knowledge questions" ON knowledge_questions;
DROP POLICY IF EXISTS "Platform admins can view all knowledge question options" ON knowledge_question_options;
DROP POLICY IF EXISTS "Platform admins can create knowledge question options" ON knowledge_question_options;
DROP POLICY IF EXISTS "Platform admins can update knowledge question options" ON knowledge_question_options;
DROP POLICY IF EXISTS "Platform admins can delete knowledge question options" ON knowledge_question_options;

-- =====================================================
-- Knowledge Assessments Policies
-- =====================================================

-- Platform admins can SELECT
CREATE POLICY "Platform admins can view all knowledge assessments"
  ON knowledge_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can INSERT
CREATE POLICY "Platform admins can create knowledge assessments"
  ON knowledge_assessments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can UPDATE
CREATE POLICY "Platform admins can update knowledge assessments"
  ON knowledge_assessments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can DELETE
CREATE POLICY "Platform admins can delete knowledge assessments"
  ON knowledge_assessments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- =====================================================
-- Knowledge Questions Policies
-- =====================================================

-- Platform admins can SELECT
CREATE POLICY "Platform admins can view all knowledge questions"
  ON knowledge_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can INSERT
CREATE POLICY "Platform admins can create knowledge questions"
  ON knowledge_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can UPDATE
CREATE POLICY "Platform admins can update knowledge questions"
  ON knowledge_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can DELETE
CREATE POLICY "Platform admins can delete knowledge questions"
  ON knowledge_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- =====================================================
-- Knowledge Question Options Policies
-- =====================================================

-- Platform admins can SELECT
CREATE POLICY "Platform admins can view all knowledge question options"
  ON knowledge_question_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can INSERT
CREATE POLICY "Platform admins can create knowledge question options"
  ON knowledge_question_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can UPDATE
CREATE POLICY "Platform admins can update knowledge question options"
  ON knowledge_question_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Platform admins can DELETE
CREATE POLICY "Platform admins can delete knowledge question options"
  ON knowledge_question_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

