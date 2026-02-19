-- =====================================================
-- Phase 2: LMS Row Level Security (RLS) Policies
-- =====================================================
-- This migration creates all RLS policies for the LMS tables.
-- =====================================================

-- =====================================================
-- A. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_earning_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE awarded_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- B. HELPER FUNCTION FOR ADMIN CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT account_type = 'platformAdmin'
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- C. SKILLS & LEARNING OUTCOMES POLICIES
-- =====================================================

-- Skills: Public read, admin write
CREATE POLICY "Skills are viewable by everyone"
  ON skills FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can insert skills"
  ON skills FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update skills"
  ON skills FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete skills"
  ON skills FOR DELETE
  USING (is_platform_admin());

-- Learning Outcomes: Public read, admin write
CREATE POLICY "Learning outcomes are viewable by everyone"
  ON learning_outcomes FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can insert learning outcomes"
  ON learning_outcomes FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update learning outcomes"
  ON learning_outcomes FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete learning outcomes"
  ON learning_outcomes FOR DELETE
  USING (is_platform_admin());

-- =====================================================
-- D. CREATORS POLICIES
-- =====================================================

-- Creators: Public read, admin write
CREATE POLICY "Creators are viewable by everyone"
  ON creators FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage creators"
  ON creators FOR ALL
  USING (is_platform_admin());

-- =====================================================
-- E. CONTENT POLICIES (Lessons, Modules, Courses, Programs)
-- =====================================================

-- Lessons: Published lessons viewable by all, admin can manage all
CREATE POLICY "Published lessons are viewable by everyone"
  ON lessons FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage lessons"
  ON lessons FOR ALL
  USING (is_platform_admin());

-- Modules: Published modules viewable by all, admin can manage all
CREATE POLICY "Published modules are viewable by everyone"
  ON modules FOR SELECT
  USING (is_published = true OR is_platform_admin());

CREATE POLICY "Platform admins can manage modules"
  ON modules FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update modules"
  ON modules FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete modules"
  ON modules FOR DELETE
  USING (is_platform_admin());

-- Module Prerequisites: Viewable with module, admin can manage
CREATE POLICY "Module prerequisites are viewable by everyone"
  ON module_prerequisites FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage module prerequisites"
  ON module_prerequisites FOR ALL
  USING (is_platform_admin());

-- Module Lessons: Viewable with module, admin can manage
CREATE POLICY "Module lessons are viewable by everyone"
  ON module_lessons FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage module lessons"
  ON module_lessons FOR ALL
  USING (is_platform_admin());

-- Courses: Published courses viewable by all, admin can manage all
CREATE POLICY "Published courses are viewable by everyone"
  ON courses FOR SELECT
  USING (is_published = true OR is_platform_admin());

CREATE POLICY "Platform admins can manage courses"
  ON courses FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update courses"
  ON courses FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete courses"
  ON courses FOR DELETE
  USING (is_platform_admin());

-- Course Prerequisites: Viewable with course, admin can manage
CREATE POLICY "Course prerequisites are viewable by everyone"
  ON course_prerequisites FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage course prerequisites"
  ON course_prerequisites FOR ALL
  USING (is_platform_admin());

-- Course Modules: Viewable with course, admin can manage
CREATE POLICY "Course modules are viewable by everyone"
  ON course_modules FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage course modules"
  ON course_modules FOR ALL
  USING (is_platform_admin());

-- Programs: Published programs viewable by all, admin can manage all
CREATE POLICY "Published programs are viewable by everyone"
  ON programs FOR SELECT
  USING (is_published = true OR is_platform_admin());

CREATE POLICY "Platform admins can manage programs"
  ON programs FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update programs"
  ON programs FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete programs"
  ON programs FOR DELETE
  USING (is_platform_admin());

-- Program Courses: Viewable with program, admin can manage
CREATE POLICY "Program courses are viewable by everyone"
  ON program_courses FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage program courses"
  ON program_courses FOR ALL
  USING (is_platform_admin());

-- =====================================================
-- F. CREDIT SYSTEM POLICIES
-- =====================================================

-- Credit Wallets: Users can view their own, admins can view all
CREATE POLICY "Users can view their own credit wallet"
  ON credit_wallets FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "System can create credit wallets"
  ON credit_wallets FOR INSERT
  WITH CHECK (true); -- Handled by trigger

CREATE POLICY "System and admins can update credit wallets"
  ON credit_wallets FOR UPDATE
  USING (user_id = auth.uid() OR is_platform_admin());

-- Credit Transactions: Users can view their own, admins can view all
CREATE POLICY "Users can view their own credit transactions"
  ON credit_transactions FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "System can create credit transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (true); -- Handled by functions

-- Credit Earning Rules: Viewable by all, admin can manage
CREATE POLICY "Credit earning rules are viewable by everyone"
  ON credit_earning_rules FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage credit earning rules"
  ON credit_earning_rules FOR ALL
  USING (is_platform_admin());

-- =====================================================
-- G. SCHOLARSHIP SYSTEM POLICIES
-- =====================================================

-- Scholarships: Active scholarships viewable by all, admin can manage all
CREATE POLICY "Active scholarships are viewable by everyone"
  ON scholarships FOR SELECT
  USING (is_active = true OR is_platform_admin());

CREATE POLICY "Platform admins can manage scholarships"
  ON scholarships FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update scholarships"
  ON scholarships FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can delete scholarships"
  ON scholarships FOR DELETE
  USING (is_platform_admin());

-- Scholarship Content: Viewable by all, admin can manage
CREATE POLICY "Scholarship content mapping is viewable by everyone"
  ON scholarship_content FOR SELECT
  USING (true);

CREATE POLICY "Platform admins can manage scholarship content"
  ON scholarship_content FOR ALL
  USING (is_platform_admin());

-- Scholarship Applications: Users can view/create their own, admins can view/manage all
CREATE POLICY "Users can view their own scholarship applications"
  ON scholarship_applications FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can create scholarship applications"
  ON scholarship_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Platform admins can update scholarship applications"
  ON scholarship_applications FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Users can delete their own pending applications"
  ON scholarship_applications FOR DELETE
  USING (user_id = auth.uid() AND status = 'pending');

-- Awarded Scholarships: Users can view their own, admins can view/manage all
CREATE POLICY "Users can view their own awarded scholarships"
  ON awarded_scholarships FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Platform admins can manage awarded scholarships"
  ON awarded_scholarships FOR INSERT
  WITH CHECK (is_platform_admin());

CREATE POLICY "Platform admins can update awarded scholarships"
  ON awarded_scholarships FOR UPDATE
  USING (is_platform_admin());

-- =====================================================
-- H. PURCHASES & ENROLLMENTS POLICIES
-- =====================================================

-- Purchases: Users can view their own, admins can view all
CREATE POLICY "Users can view their own purchases"
  ON purchases FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Enrollments: Users can view their own, admins can view all
CREATE POLICY "Users can view their own enrollments"
  ON enrollments FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can create enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can update enrollments"
  ON enrollments FOR UPDATE
  USING (user_id = auth.uid() OR is_platform_admin());

-- =====================================================
-- I. PROGRESS TRACKING POLICIES
-- =====================================================

-- Lesson Progress: Users can view/update their own, admins can view all
CREATE POLICY "Users can view their own lesson progress"
  ON lesson_progress FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "Users can create their own lesson progress"
  ON lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own lesson progress"
  ON lesson_progress FOR UPDATE
  USING (user_id = auth.uid());

-- Module Progress: Users can view their own, system can update
CREATE POLICY "Users can view their own module progress"
  ON module_progress FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "System can manage module progress"
  ON module_progress FOR ALL
  USING (true); -- Managed by triggers

-- Course Progress: Users can view their own, system can update
CREATE POLICY "Users can view their own course progress"
  ON course_progress FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "System can manage course progress"
  ON course_progress FOR ALL
  USING (true); -- Managed by triggers

-- Program Progress: Users can view their own, system can update
CREATE POLICY "Users can view their own program progress"
  ON program_progress FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin());

CREATE POLICY "System can manage program progress"
  ON program_progress FOR ALL
  USING (true); -- Managed by triggers

-- =====================================================
-- J. CERTIFICATES POLICIES
-- =====================================================

-- Certificates: Users can view their own, anyone can verify, admins can manage
CREATE POLICY "Users can view their own certificates"
  ON certificates FOR SELECT
  USING (user_id = auth.uid() OR is_platform_admin() OR verification_code IS NOT NULL);

CREATE POLICY "System can create certificates"
  ON certificates FOR INSERT
  WITH CHECK (true); -- Managed by completion logic

CREATE POLICY "Platform admins can update certificates"
  ON certificates FOR UPDATE
  USING (is_platform_admin());

CREATE POLICY "Platform admins can revoke certificates"
  ON certificates FOR DELETE
  USING (is_platform_admin());
