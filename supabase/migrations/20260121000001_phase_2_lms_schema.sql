-- =====================================================
-- Phase 2: Learning Management System (LMS) Schema
-- =====================================================
-- This migration creates all tables, indexes, and relationships
-- for the Luna Careers LMS system.
--
-- Content Hierarchy: Programs → Courses → Modules → Lessons (SCORM)
-- Credits Economy: Earn on completion, spend on enrollment
-- Scholarships: Full/partial discounts with application workflow
-- =====================================================

-- =====================================================
-- A. SKILLS & LEARNING OUTCOMES
-- =====================================================

-- Master Skills List
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'technical', 'soft_skill', 'industry_specific'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Outcomes Library
CREATE TABLE learning_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outcome_text TEXT NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'knowledge', 'skills', 'abilities'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_learning_outcomes_category ON learning_outcomes(category);

-- =====================================================
-- B. CONTENT CREATORS
-- =====================================================

-- Creators (Institutions, Organizations, Individuals - NO user accounts connected)
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'individual', 'institution', 'organization', 'partner'
  bio TEXT,
  logo_url TEXT,
  website_url TEXT,
  contact_email VARCHAR(255),
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_creators_type ON creators(type);
CREATE INDEX idx_creators_verified ON creators(verified);

-- =====================================================
-- C. LEARNING CONTENT HIERARCHY
-- =====================================================

-- 1. LESSONS (Base unit - SCORM files)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scorm_package_url TEXT NOT NULL,
  scorm_version VARCHAR(10) NOT NULL, -- '1.2' or '2004'
  duration_minutes INTEGER NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  has_quiz BOOLEAN DEFAULT false,
  passing_score INTEGER, -- Percentage (0-100), NULL if no passing requirement
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. MODULES
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  learning_outcomes JSONB DEFAULT '[]'::jsonb, -- [{ id: uuid, outcome_text: string }]
  skills JSONB DEFAULT '[]'::jsonb, -- [{ id: uuid, name: string, category: string }]
  level VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  price_credits INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  intro_video_url TEXT,
  cover_image_url TEXT,
  duration_minutes INTEGER DEFAULT 0, -- Auto-computed
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  requirements TEXT,
  scholarship_eligible BOOLEAN DEFAULT false,
  scholarship_types JSONB DEFAULT '[]'::jsonb, -- ['full', 'partial']
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module Prerequisites (Many-to-Many)
CREATE TABLE module_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prerequisite_module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, prerequisite_module_id)
);

-- Module Lessons (Ordered relationship)
CREATE TABLE module_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, lesson_id),
  UNIQUE(module_id, sort_order)
);

-- 3. COURSES
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  level VARCHAR(20) NOT NULL,
  price_credits INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  intro_video_url TEXT,
  cover_image_url TEXT,
  duration_minutes INTEGER DEFAULT 0, -- Auto-computed
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  requirements TEXT,
  scholarship_eligible BOOLEAN DEFAULT false,
  scholarship_types JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Prerequisites
CREATE TABLE course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, prerequisite_course_id)
);

-- Course Modules (Ordered relationship)
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, module_id),
  UNIQUE(course_id, sort_order)
);

-- 4. PROGRAMS
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  level VARCHAR(20) NOT NULL,
  price_credits INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  intro_video_url TEXT,
  cover_image_url TEXT,
  duration_minutes INTEGER DEFAULT 0, -- Auto-computed
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  requirements TEXT,
  scholarship_eligible BOOLEAN DEFAULT false,
  scholarship_types JSONB DEFAULT '[]'::jsonb,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Program Courses (Ordered relationship)
CREATE TABLE program_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, course_id),
  UNIQUE(program_id, sort_order)
);

-- Indexes for content tables
CREATE INDEX idx_modules_published ON modules(is_published);
CREATE INDEX idx_modules_creator ON modules(creator_id);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_creator ON courses(creator_id);
CREATE INDEX idx_programs_published ON programs(is_published);
CREATE INDEX idx_programs_creator ON programs(creator_id);
CREATE INDEX idx_lessons_creator ON lessons(creator_id);

-- =====================================================
-- D. LEARNING CREDITS ECONOMY
-- =====================================================

-- Credit Wallets (One per user)
CREATE TABLE credit_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  lifetime_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Transactions (Ledger)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'spent', 'refunded', 'admin_adjustment'
  amount INTEGER NOT NULL, -- Positive for earned, negative for spent
  balance_after INTEGER NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'module_completion', 'course_completion', 'program_completion', 'purchase', 'admin'
  source_id UUID, -- References completion or purchase record
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credit Earning Rules
CREATE TABLE credit_earning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(20) NOT NULL, -- 'module', 'course', 'program'
  content_id UUID, -- NULL means default rule for all content of this type
  credits_awarded INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_wallets_user ON credit_wallets(user_id);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_earning_rules_content ON credit_earning_rules(content_type, content_id);

-- =====================================================
-- E. SCHOLARSHIP SYSTEM
-- =====================================================

-- Scholarship Programs
CREATE TABLE scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'full', 'partial'
  discount_percentage INTEGER NOT NULL, -- 50, 75, 100
  total_slots INTEGER,
  slots_remaining INTEGER,
  eligibility_criteria JSONB DEFAULT '{}'::jsonb, -- Flexible criteria structure
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scholarship Content Mapping (Which scholarships apply to what content)
CREATE TABLE scholarship_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL, -- 'module', 'course', 'program'
  content_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scholarship_id, content_type, content_id)
);

-- Scholarship Applications
CREATE TABLE scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  application_data JSONB DEFAULT '{}'::jsonb, -- User's responses to criteria
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  UNIQUE(user_id, scholarship_id, content_type, content_id)
);

-- Awarded Scholarships
CREATE TABLE awarded_scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID UNIQUE NOT NULL REFERENCES scholarship_applications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id UUID NOT NULL REFERENCES scholarships(id),
  content_type VARCHAR(20) NOT NULL,
  content_id UUID NOT NULL,
  discount_percentage INTEGER NOT NULL,
  original_price INTEGER NOT NULL,
  discounted_price INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_scholarships_active ON scholarships(is_active);
CREATE INDEX idx_scholarship_applications_status ON scholarship_applications(status);
CREATE INDEX idx_scholarship_applications_user ON scholarship_applications(user_id);
CREATE INDEX idx_awarded_scholarships_user ON awarded_scholarships(user_id);
CREATE INDEX idx_awarded_scholarships_used ON awarded_scholarships(used);

-- =====================================================
-- F. PURCHASES & ENROLLMENTS
-- =====================================================

-- Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchasable_type VARCHAR(20) NOT NULL, -- 'module', 'course', 'program'
  purchasable_id UUID NOT NULL,
  original_price_credits INTEGER NOT NULL,
  discount_amount_credits INTEGER DEFAULT 0,
  final_price_credits INTEGER NOT NULL,
  payment_method VARCHAR(20) NOT NULL, -- 'credits', 'free', 'scholarship'
  scholarship_id UUID REFERENCES awarded_scholarships(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- NULL for lifetime access
);

-- Enrollments
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_type VARCHAR(20) NOT NULL, -- 'module', 'course', 'program'
  enrollment_id UUID NOT NULL,
  purchase_id UUID REFERENCES purchases(id),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'expired'
  completion_credits_awarded INTEGER,
  credits_awarded_at TIMESTAMPTZ,
  UNIQUE(user_id, enrollment_type, enrollment_id)
);

-- Indexes
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_purchasable ON purchases(purchasable_type, purchasable_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_enrollment ON enrollments(enrollment_type, enrollment_id);

-- =====================================================
-- G. PROGRESS TRACKING & SCORM DATA
-- =====================================================

-- Lesson Progress (SCORM-level tracking)
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'failed', 'passed'
  score_raw DECIMAL(5,2), -- 0-100
  score_min DECIMAL(5,2),
  score_max DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  quiz_attempts INTEGER DEFAULT 0,
  quiz_data JSONB DEFAULT '{}'::jsonb, -- Parsed quiz results
  scorm_cmi_data JSONB DEFAULT '{}'::jsonb, -- Complete SCORM CMI data
  last_accessed TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  passed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Module Progress (Computed from lesson_progress)
CREATE TABLE module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Course Progress
CREATE TABLE course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Program Progress
CREATE TABLE program_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'not_started',
  completion_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, program_id)
);

-- Indexes
CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX idx_module_progress_user ON module_progress(user_id);
CREATE INDEX idx_module_progress_status ON module_progress(status);
CREATE INDEX idx_course_progress_user ON course_progress(user_id);
CREATE INDEX idx_program_progress_user ON program_progress(user_id);

-- =====================================================
-- H. CERTIFICATES
-- =====================================================

-- Certificates
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_type VARCHAR(20) NOT NULL, -- 'module', 'course', 'program'
  content_id UUID NOT NULL,
  content_type VARCHAR(20) NOT NULL,
  content_title VARCHAR(255) NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT, -- PDF storage URL
  verification_code VARCHAR(50) UNIQUE NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_certificates_user ON certificates(user_id);
CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_certificates_content ON certificates(content_type, content_id);
