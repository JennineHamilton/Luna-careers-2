We are building a comprehensive Learning Management System (LMS) for LUNA Careers, a multi-tenant career development platform. This phase focuses on creating the complete backend infrastructure, database architecture, and admin portal interfaces for managing learning content, scholarships, and the learning credits economy.

📋 What We're Building in This Phase
1. Complete Database Schema & Supabase Setup
2. Learning Credits Economy System
3. Scholarship Management System
4. Custom SCORM Player Foundation
5. Content Management System (Lessons, Modules, Courses, Programs)
6. Admin Portal UI for LMS Management

🗂️ CORRECT FILE PATH STRUCTURE
Admin Portal Root: /app/cmd/learning/
All LMS management interfaces will be located under this path:
app/
└── cmd/
    └── learning/
        ├── page.tsx                          # LMS Dashboard
        ├── skills/
        │   └── page.tsx                      # Skills Management
        ├── outcomes/
        │   └── page.tsx                      # Learning Outcomes Management
        ├── creators/
        │   ├── page.tsx                      # Creators List
        │   ├── new/
        │   │   └── page.tsx                  # Create Creator
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx              # Edit Creator
        ├── lessons/
        │   ├── page.tsx                      # Lessons List
        │   ├── new/
        │   │   └── page.tsx                  # Create Lesson
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx              # Edit Lesson
        ├── modules/
        │   ├── page.tsx                      # Modules List
        │   ├── new/
        │   │   └── page.tsx                  # Create Module
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx              # Edit Module
        ├── courses/
        │   ├── page.tsx                      # Courses List
        │   ├── new/
        │   │   └── page.tsx                  # Create Course
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx              # Edit Course
        ├── programs/
        │   ├── page.tsx                      # Programs List
        │   ├── new/
        │   │   └── page.tsx                  # Create Program
        │   └── [id]/
        │       └── edit/
        │           └── page.tsx              # Edit Program
        ├── scholarships/
        │   ├── page.tsx                      # Scholarships List
        │   ├── new/
        │   │   └── page.tsx                  # Create Scholarship
        │   ├── [id]/
        │   │   └── edit/
        │   │       └── page.tsx              # Edit Scholarship
        │   └── applications/
        │       ├── page.tsx                  # Applications Queue
        │       └── [id]/
        │           └── page.tsx              # Application Detail/Review
        └── credits/
            ├── rules/
            │   └── page.tsx                  # Credit Earning Rules
            └── transactions/
                └── page.tsx                  # Credit Transactions Log

🗄️ PART 1: DATABASE SCHEMA
Technology Stack

Database: Supabase (PostgreSQL)
Storage: Supabase Storage for SCORM packages, videos, images
Authentication: Existing Supabase Auth integration

Required Tables & Structure
A. Skills & Learning Outcomes
sql-- Master Skills List
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
B. Content Creators
sql-- Creators (Institutions, Organizations, Individuals - NO user accounts connected)
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
C. Learning Content Hierarchy
sql-- 1. LESSONS (Base unit - SCORM files)
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
D. Learning Credits Economy
sql-- Credit Wallets (One per user)
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
E. Scholarship System
sql-- Scholarship Programs
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
F. Purchases & Enrollments
sql-- Purchases
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
G. Progress Tracking & SCORM Data
sql-- Lesson Progress (SCORM-level tracking)
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
H. Certificates
sql-- Certificates
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

🔧 PART 2: DATABASE FUNCTIONS & TRIGGERS
Auto-Compute Duration Functions
sql-- Function: Compute Module Duration
CREATE OR REPLACE FUNCTION compute_module_duration(p_module_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(l.duration_minutes), 0)::INTEGER
  FROM module_lessons ml
  JOIN lessons l ON ml.lesson_id = l.id
  WHERE ml.module_id = p_module_id;
$$ LANGUAGE SQL;

-- Function: Compute Course Duration
CREATE OR REPLACE FUNCTION compute_course_duration(p_course_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(m.duration_minutes), 0)::INTEGER
  FROM course_modules cm
  JOIN modules m ON cm.module_id = m.id
  WHERE cm.course_id = p_course_id;
$$ LANGUAGE SQL;

-- Function: Compute Program Duration
CREATE OR REPLACE FUNCTION compute_program_duration(p_program_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(c.duration_minutes), 0)::INTEGER
  FROM program_courses pc
  JOIN courses c ON pc.course_id = c.id
  WHERE pc.program_id = p_program_id;
$$ LANGUAGE SQL;

-- Trigger: Update Module Duration on Lesson Changes
CREATE OR REPLACE FUNCTION update_module_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE modules
  SET duration_minutes = compute_module_duration(COALESCE(NEW.module_id, OLD.module_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.module_id, OLD.module_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_duration
AFTER INSERT OR UPDATE OR DELETE ON module_lessons
FOR EACH ROW EXECUTE FUNCTION update_module_duration();

-- Trigger: Update Course Duration on Module Changes
CREATE OR REPLACE FUNCTION update_course_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET duration_minutes = compute_course_duration(COALESCE(NEW.course_id, OLD.course_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_duration
AFTER INSERT OR UPDATE OR DELETE ON course_modules
FOR EACH ROW EXECUTE FUNCTION update_course_duration();

-- Trigger: Update Program Duration on Course Changes
CREATE OR REPLACE FUNCTION update_program_duration()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE programs
  SET duration_minutes = compute_program_duration(COALESCE(NEW.program_id, OLD.program_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.program_id, OLD.program_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_program_duration
AFTER INSERT OR UPDATE OR DELETE ON program_courses
FOR EACH ROW EXECUTE FUNCTION update_program_duration();
Credit Transaction Functions
sql-- Function: Award Credits
CREATE OR REPLACE FUNCTION award_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS VOID AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance + p_amount,
      lifetime_earned = lifetime_earned + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'earned', p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Spend Credits
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source_type VARCHAR,
  p_source_id UUID,
  p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check balance
  SELECT balance INTO v_current_balance
  FROM credit_wallets
  WHERE user_id = p_user_id;
  
  IF v_current_balance < p_amount THEN
    RETURN FALSE; -- Insufficient funds
  END IF;
  
  -- Update wallet
  UPDATE credit_wallets
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  -- Create transaction record
  INSERT INTO credit_transactions (
    user_id, transaction_type, amount, balance_after,
    source_type, source_id, description
  ) VALUES (
    p_user_id, 'spent', -p_amount, v_new_balance,
    p_source_type, p_source_id, p_description
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
Progress Calculation Functions
sql-- Function: Calculate Module Progress
CREATE OR REPLACE FUNCTION calculate_module_progress(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_lessons INTEGER;
  v_completed_lessons INTEGER;
  v_required_lessons INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required lessons
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_lessons, v_required_lessons
  FROM module_lessons
  WHERE module_id = p_module_id;
  
  -- Count completed lessons
  SELECT 
    COUNT(*) FILTER (WHERE lp.status IN ('completed', 'passed')),
    COUNT(*) FILTER (WHERE ml.is_required = true AND lp.status IN ('completed', 'passed'))
  INTO v_completed_lessons, v_completed_required
  FROM module_lessons ml
  LEFT JOIN lesson_progress lp ON ml.lesson_id = lp.lesson_id AND lp.user_id = p_user_id
  WHERE ml.module_id = p_module_id;
  
  -- Calculate completion percentage (based on required lessons)
  IF v_required_lessons > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_lessons;
  ELSE
    v_completion_percentage := 0;
  END IF;
  
  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_lessons', v_total_lessons,
    'completed_lessons', v_completed_lessons,
    'required_lessons', v_required_lessons,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Course Progress
CREATE OR REPLACE FUNCTION calculate_course_progress(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_modules INTEGER;
  v_completed_modules INTEGER;
  v_required_modules INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required modules
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_modules, v_required_modules
  FROM course_modules
  WHERE course_id = p_course_id;
  
  -- Count completed modules
  SELECT 
    COUNT(*) FILTER (WHERE mp.status = 'completed'),
    COUNT(*) FILTER (WHERE cm.is_required = true AND mp.status = 'completed')
  INTO v_completed_modules, v_completed_required
  FROM course_modules cm
  LEFT JOIN module_progress mp ON cm.module_id = mp.module_id AND mp.user_id = p_user_id
  WHERE cm.course_id = p_course_id;
  
  -- Calculate completion percentage (based on required modules)
  IF v_required_modules > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_modules;
  ELSE
    v_completion_percentage := 0;
  END IF;
  
  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_modules', v_total_modules,
    'completed_modules', v_completed_modules,
    'required_modules', v_required_modules,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Program Progress
CREATE OR REPLACE FUNCTION calculate_program_progress(
  p_user_id UUID,
  p_program_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_total_courses INTEGER;
  v_completed_courses INTEGER;
  v_required_courses INTEGER;
  v_completed_required INTEGER;
  v_completion_percentage INTEGER;
  v_status VARCHAR(20);
BEGIN
  -- Count total and required courses
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_required = true)
  INTO v_total_courses, v_required_courses
  FROM program_courses
  WHERE program_id = p_program_id;
  
  -- Count completed courses
  SELECT 
    COUNT(*) FILTER (WHERE cp.status = 'completed'),
    COUNT(*) FILTER (WHERE pc.is_required = true AND cp.status = 'completed')
  INTO v_completed_courses, v_completed_required
  FROM program_courses pc
  LEFT JOIN course_progress cp ON pc.course_id = cp.course_id AND cp.user_id = p_user_id
  WHERE pc.program_id = p_program_id;
  
  -- Calculate completion percentage (based on required courses)
  IF v_required_courses > 0 THEN
    v_completion_percentage := (v_completed_required * 100) / v_required_courses;
  ELSE
    v_completion_percentage := 0;
  END IF;
  
  -- Determine status
  IF v_completion_percentage = 100 THEN
    v_status := 'completed';
  ELSIF v_completion_percentage > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;
  
  RETURN jsonb_build_object(
    'status', v_status,
    'completion_percentage', v_completion_percentage,
    'total_courses', v_total_courses,
    'completed_courses', v_completed_courses,
    'required_courses', v_required_courses,
    'completed_required', v_completed_required
  );
END;
$$ LANGUAGE plpgsql;

🎨 PART 3: ADMIN PORTAL UI
Location: /app/cmd/learning/
Required Pages
1. LMS Dashboard (/app/cmd/learning/page.tsx)

Overview Stats:

Total Lessons, Modules, Courses, Programs
Total Enrollments (Active, Completed)
Total Credits Awarded vs Spent
Active Scholarships
Pending Scholarship Applications


Quick Actions:

Create New Lesson
Create New Module
Create New Course
Create New Program
Create Scholarship
View Scholarship Applications


Recent Activity Feed:

Latest enrollments
Recent completions
New scholarship applications



2. Skills Management (/app/cmd/learning/skills/page.tsx)

List View: Table with all skills
Columns: Name, Category, # of Content Using, Created Date, Actions
Actions:

Add New Skill (Modal)
Edit Skill (Inline or Modal)
Delete Skill (with confirmation)
Bulk Import from CSV


Filter/Search: By category, search by name

3. Learning Outcomes Management (/app/cmd/learning/outcomes/page.tsx)

Similar structure to Skills Management
Add, Edit, Delete outcomes
Categorize outcomes (Knowledge, Skills, Abilities)

4. Creators Management (/app/cmd/learning/creators/page.tsx)

List View: All creators
Columns: Name, Type, Logo, Verified, # of Content, Actions
Actions:

Add New Creator (Modal or form page)
Edit Creator Details
Toggle Verified Status
View Creator's Content
Delete Creator



5. Lessons Management (/app/cmd/learning/lessons/)
List Page (page.tsx):

Table with: Title, Creator, Duration, Has Quiz, Used in # Modules, Actions
Filter: By creator, has quiz, duration range
Search: By title
Actions: View, Edit, Delete, Upload New

Create/Edit Page (new/page.tsx, [id]/edit/page.tsx):

Form Fields:

Title (required)
Description (textarea)
SCORM Package Upload (file input with drag-drop)
SCORM Version (dropdown: 1.2, 2004)
Duration in Minutes (number input)
Creator (searchable dropdown)
Has Quiz? (checkbox)
Passing Score (number 0-100, conditional on has_quiz)


SCORM Upload Flow:

User uploads .zip file
System uploads to Supabase Storage: /scorm-packages/{lesson-id}/
Extract and validate manifest
Auto-detect SCORM version
Store package URL in database


Validation:

SCORM package must be valid .zip
Must contain imsmanifest.xml
Duration must be > 0


Save Actions: Save Draft, Save & Publish

6. Modules Management (/app/cmd/learning/modules/)
List Page (page.tsx):

Grid or Table view
Columns: Cover Image, Title, Level, Duration, Price, Published, # Enrollments, Actions
Filter: Level, Price Range, Creator, Published Status
Actions: View, Edit, Delete, Duplicate, Publish/Unpublish

Create/Edit Page (new/page.tsx, [id]/edit/page.tsx):

Form Tabs:
Tab 1: Basic Info

Title (required)
Description (rich text editor)
Level (dropdown: Beginner, Intermediate, Advanced)
Creator (searchable dropdown)
Requirements (textarea)

Tab 2: Media

Cover Image (upload with preview)
Intro Video URL (text input with validation)

Tab 3: Skills & Outcomes

Learning Outcomes (multi-select from learning_outcomes table)

Display as tags
Can add new on-the-fly


Skills (multi-select from skills table)

Display as tags with categories
Can add new on-the-fly



Tab 4: Lessons

Lesson Builder:

Search and add lessons from library
Drag-and-drop to reorder
Mark as Required/Optional
Display: Lesson title, duration, quiz indicator
Auto-compute total module duration


Empty State: "No lessons added yet. Search to add lessons."

Tab 5: Prerequisites

Multi-select from other published modules
Display as cards showing module title + level

Tab 6: Pricing & Scholarships

Is Free? (checkbox)
Price in Credits (number input, disabled if is_free)
Scholarship Eligible? (checkbox)
Scholarship Types (multi-select: Full, Partial)


Preview Mode: Button to preview how module looks to learners
Save Actions: Save Draft, Save & Publish

7. Courses Management (/app/cmd/learning/courses/)

Same structure as Modules, but:

Tab 4: Module Builder (instead of Lesson Builder)
Add modules in order
Auto-compute course duration from modules



8. Programs Management (/app/cmd/learning/programs/)

Same structure as Courses, but:

Tab 4: Course Builder (instead of Module Builder)
Add courses in order
Auto-compute program duration from courses
NO prerequisites section (programs are top-level)



9. Scholarship Management (/app/cmd/learning/scholarships/)
List Page (page.tsx):

Table: Name, Type, Discount %, Total Slots, Remaining Slots, Status, Valid Dates, Actions
Filter: Type, Active/Inactive, Expiring Soon
Actions: View, Edit, Deactivate, View Applications

Create/Edit Page (new/page.tsx, [id]/edit/page.tsx):

Form Sections:
Basic Info

Name (required)
Description (rich text)
Type (dropdown: Full, Partial)
Discount Percentage (number, pre-filled based on type)

Availability

Total Slots (number, nullable for unlimited)
Valid From (date picker)
Valid Until (date picker)
Is Active (toggle)

Eligibility Criteria (Flexible JSON builder)

Add criteria fields dynamically:

Field Name (text)
Field Type (dropdown: text, number, boolean, select, file)
Required? (checkbox)
Validation Rules (conditional inputs)


Example criteria:

"Why do you need this scholarship?" (text, required)
"Income Range" (select, required)
"Proof of Enrollment" (file upload)



Applicable Content

Select which modules/courses/programs this scholarship applies to
Multi-select with search
Display: Content type badge, title, price
"Apply to All" shortcut options



Applications Queue (/app/cmd/learning/scholarships/applications/page.tsx):

Table: Applicant Name, Applied For (content), Scholarship, Applied Date, Status, Actions
Filter: Status (Pending, Approved, Rejected), Scholarship, Date Range
Bulk Actions: Approve Selected, Reject Selected
Individual Actions: View Application, Approve, Reject

Application Detail View (/app/cmd/learning/scholarships/applications/[id]/page.tsx):

Applicant Info: Name, email, profile link
Applied For: Content type, title, original price
Scholarship: Name, discount percentage
Application Responses:

Display all criteria field responses
File downloads if applicable


Review Section:

Status dropdown (Pending, Approved, Rejected)
Review Notes (textarea)
Action Buttons: Approve, Reject, Save Notes


History: Previous applications, awarded scholarships

10. Credit Earning Rules (/app/cmd/learning/credits/rules/page.tsx)

Default Rules Section:

Module Completion: X credits (editable)
Course Completion: Y credits (editable)
Program Completion: Z credits (editable)


Custom Rules Table:

Specific content overrides
Columns: Content Type, Content Title, Credits Awarded, Active, Actions
Add Rule: Select content, set custom credit amount


Save Changes button to update rules

11. Credit Transactions Log (/app/cmd/learning/credits/transactions/page.tsx)

Filter Section:

User (searchable)
Transaction Type (Earned, Spent, Admin Adjustment)
Date Range
Source Type


Table:

Date, User, Type, Amount, Balance After, Source, Description


Export to CSV button
Admin Actions:

Manual Adjustment (modal to add/subtract credits with reason)




🔐 PART 4: ROW LEVEL SECURITY (RLS)
Supabase RLS Policies
sql-- Enable RLS on all tables
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
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

-- Example Policies

-- 1. Public read access to published content
CREATE POLICY "Public can view published modules"
ON modules FOR SELECT
USING (is_published = true);

CREATE POLICY "Public can view published courses"
ON courses FOR SELECT
USING (is_published = true);

CREATE POLICY "Public can view published programs"
ON programs FOR SELECT
USING (is_published = true);

-- 2. Public read access to skills and outcomes
CREATE POLICY "Public can view skills"
ON skills FOR SELECT
USING (true);

CREATE POLICY "Public can view learning outcomes"
ON learning_outcomes FOR SELECT
USING (true);

CREATE POLICY "Public can view creators"
ON creators FOR SELECT
USING (true);

-- 3. Admins can do everything on content
CREATE POLICY "Admins full access to modules"
ON modules
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

-- Similar policies for courses, programs, lessons, etc.

-- 4. Users can view their own enrollments
CREATE POLICY "Users can view own enrollments"
ON enrollments FOR SELECT
USING (user_id = auth.uid());

-- 5. Users can view their own credit wallet
CREATE POLICY "Users can view own wallet"
ON credit_wallets FOR SELECT
USING (user_id = auth.uid());

-- 6. Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON credit_transactions FOR SELECT
USING (user_id = auth.uid());

-- 7. Users can view their own progress
CREATE POLICY "Users can view own lesson progress"
ON lesson_progress FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update own lesson progress"
ON lesson_progress FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own lesson progress"
ON lesson_progress FOR UPDATE
USING (user_id = auth.uid());

-- Similar policies for module_progress, course_progress, program_progress

-- 8. Users can view their own certificates
CREATE POLICY "Users can view own certificates"
ON certificates FOR SELECT
USING (user_id = auth.uid());

-- 9. Users can apply for scholarships
CREATE POLICY "Users can create scholarship applications"
ON scholarship_applications FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own scholarship applications"
ON scholarship_applications FOR SELECT
USING (user_id = auth.uid());

-- 10. Admins can manage scholarships
CREATE POLICY "Admins full access to scholarships"
ON scholarships
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Admins can view all applications"
ON scholarship_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

CREATE POLICY "Admins can update applications"
ON scholarship_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
  )
);

🎨 PART 5: UI/UX COMPONENT REQUIREMENTS
Design System Compliance

Use Luna Careers Design System:

Primary Text: #292D32
Secondary Text: #5A637B
Borders: #F5F7FF
Font: SF Pro
Letter Spacing: -0.03em
Semibold Weight: 590
Medium Weight: 510



Reusable Components to Build
1. Multi-Select Dropdown (components/ui/multi-select.tsx)

For skills, learning outcomes, content selection
Features:

Search/filter
Checkboxes
Tag display of selected items
"Add New" option (for skills/outcomes)
Clear all button



2. Content Builder (components/admin/content-builder.tsx)

Drag-and-drop ordered list
Used for:

Module lessons
Course modules
Program courses


Features:

Search to add items
Reorder via drag handles
Remove items
Toggle required/optional
Display item metadata (duration, level, etc.)
Empty state with call-to-action



3. SCORM Upload Component (components/admin/scorm-upload.tsx)

File drag-drop zone
Upload progress bar
SCORM validation feedback
Preview extracted metadata
Error handling for invalid packages

4. Scholarship Application Review Card (components/admin/scholarship-review-card.tsx)

Display applicant info
Show all responses
Approve/Reject actions
Notes textarea
Status badge

5. Credit Balance Widget (components/credit-balance-widget.tsx)

Display user's credit balance
Mini transaction history
"Earn More" CTA

6. Progress Ring/Bar (components/progress-indicator.tsx)

Visual progress representation
Used in dashboards, course pages
Customizable colors and sizes


🚀 PART 6: IMPLEMENTATION PRIORITY
Sprint 1: Database Foundation (Days 1-3)

Create all database tables with correct schema
Write and test database functions (duration computation, credit transactions)
Set up triggers
Implement RLS policies
Seed initial data:

10 sample skills
10 sample learning outcomes
3 sample creators
Default credit earning rules



Sprint 2: Skills, Outcomes, Creators Management (Days 4-5)

Build Skills Management page (list + CRUD)
Build Learning Outcomes page (list + CRUD)
Build Creators Management page (list + CRUD)
Test multi-select components

Sprint 3: Lessons Management (Days 6-8)

Build Lessons list page
Build Lesson create/edit form
Implement SCORM upload to Supabase Storage
Test lesson creation flow end-to-end

Sprint 4: Modules Management (Days 9-12)

Build Modules list page
Build Module create/edit form (all tabs)
Implement Content Builder for lessons
Test module creation with lessons
Verify duration auto-calculation

Sprint 5: Courses & Programs (Days 13-16)

Build Courses management (reuse module patterns)
Build Programs management
Test full hierarchy: Program → Courses → Modules → Lessons
Verify duration propagation up the chain

Sprint 6: Credit System (Days 17-19)

Build Credit Earning Rules page
Build Credit Transactions log
Test credit awarding on enrollment completion
Test credit spending on purchases
Verify wallet balance updates

Sprint 7: Scholarship System (Days 20-24)

Build Scholarship creation/management
Build Scholarship application queue
Build Application detail/review page
Test full scholarship workflow:

Create scholarship
User applies
Admin reviews
Award scholarship
User enrolls with discount


Test partial vs full scholarships

Sprint 8: Polish & Testing (Days 25-28)

Build LMS Dashboard with stats
Add data validation and error handling
Write comprehensive tests
Performance optimization
Security audit
Documentation


📊 PART 7: CRITICAL BUSINESS LOGIC
Enrollment Logic
typescript// When user clicks "Enroll" on a course
async function enrollInCourse(userId: string, courseId: string, scholarshipId?: string) {
  // 1. Get course details
  const course = await getCourse(courseId);
  
  // 2. Check if user already enrolled
  const existingEnrollment = await checkEnrollment(userId, 'course', courseId);
  if (existingEnrollment) throw new Error('Already enrolled');
  
  // 3. Check prerequisites
  const meetsPrereqs = await checkPrerequisites(userId, course.prerequisites);
  if (!meetsPrereqs) throw new Error('Prerequisites not met');
  
  // 4. Calculate price
  let finalPrice = course.price_credits;
  let discountAmount = 0;
  let paymentMethod = 'credits';
  
  if (course.is_free) {
    finalPrice = 0;
    paymentMethod = 'free';
  } else if (scholarshipId) {
    const scholarship = await getAwardedScholarship(scholarshipId);
    discountAmount = (course.price_credits * scholarship.discount_percentage) / 100;
    finalPrice = course.price_credits - discountAmount;
    paymentMethod = 'scholarship';
    
    // Mark scholarship as used
    await markScholarshipUsed(scholarshipId);
  }
  
  // 5. Deduct credits if not free
  if (finalPrice > 0) {
    const success = await spend_credits(
      userId,
      finalPrice,
      'purchase',
      courseId,
      `Enrolled in course: ${course.title}`
    );
    if (!success) throw new Error('Insufficient credits');
  }
  
  // 6. Create purchase record
  const purchase = await createPurchase({
    userId,
    purchasableType: 'course',
    purchasableId: courseId,
    originalPrice: course.price_credits,
    discountAmount,
    finalPrice,
    paymentMethod,
    scholarshipId
  });
  
  // 7. Create enrollment record
  const enrollment = await createEnrollment({
    userId,
    enrollmentType: 'course',
    enrollmentId: courseId,
    purchaseId: purchase.id,
    status: 'active'
  });
  
  // 8. Auto-enroll in all course modules
  const modules = await getCourseModules(courseId);
  for (const module of modules) {
    await createEnrollment({
      userId,
      enrollmentType: 'module',
      enrollmentId: module.id,
      purchaseId: purchase.id,
      status: 'active'
    });
  }
  
  // 9. Send confirmation email
  await sendEnrollmentEmail(userId, course);
  
  return enrollment;
}
Completion & Credit Award Logic
typescript// When user completes the last lesson in a module
async function onLessonComplete(userId: string, lessonId: string) {
  // 1. Update lesson_progress to completed
  await updateLessonProgress(userId, lessonId, { status: 'completed' });
  
  // 2. Find all modules containing this lesson
  const modules = await getModulesContainingLesson(lessonId);
  
  for (const module of modules) {
    // 3. Calculate module progress
    const progress = await calculate_module_progress(userId, module.id);
    
    // 4. Update module_progress
    await upsertModuleProgress(userId, module.id, progress);
    
    // 5. If module just completed
    if (progress.status === 'completed' && !progress.certificate_issued) {
      // Award credits
      const creditsToAward = await getCreditsForModule(module.id);
      await award_credits(
        userId,
        creditsToAward,
        'module_completion',
        module.id,
        `Completed module: ${module.title}`
      );
      
      // Generate certificate
      const certificate = await generateCertificate(
        userId,
        'module',
        module.id,
        module.title
      );
      
      // Update enrollment
      await updateEnrollment(userId, 'module', module.id, {
        status: 'completed',
        completion_credits_awarded: creditsToAward,
        credits_awarded_at: new Date()
      });
      
      // Update module_progress
      await updateModuleProgress(userId, module.id, {
        certificate_issued: true,
        certificate_id: certificate.id
      });
      
      // Send congratulations email
      await sendCompletionEmail(userId, 'module', module);
      
      // Check if this completes a course
      await checkCourseCompletion(userId, module.id);
    }
  }
}

// Similar logic for checkCourseCompletion and checkProgramCompletion

✅ ACCEPTANCE CRITERIA
Database

 All 20+ tables created successfully
 All foreign keys and constraints working
 RLS policies tested and secure
 Database functions execute correctly
 Triggers auto-update computed fields
 Seed data loads without errors

Admin UI

 All 11 admin pages render correctly at /app/cmd/learning/*
 CRUD operations work for all content types
 Multi-select components function smoothly
 Drag-and-drop content builders work
 SCORM upload successfully stores packages
 Duration auto-calculations display correctly
 Forms validate inputs properly
 Error states handled gracefully

Credit System

 Credit wallets created for new users
 Credits awarded on completion
 Credits deducted on purchase
 Transaction log accurate
 Balance always correct
 Admin can manually adjust credits

Scholarship System

 Scholarships can be created
 Applications can be submitted
 Admin can review and approve/reject
 Awarded scholarships apply discount correctly
 Slot tracking decrements properly
 Expired scholarships don't apply

Enrollment Flow

 Free content enrolls instantly
 Paid content deducts credits
 Scholarship discounts apply
 Prerequisites enforced
 Enrolling in course auto-enrolls modules
 Enrolling in program auto-enrolls courses + modules

Completion Flow

 Lesson completion tracked
 Module progress calculated correctly
 Course progress rolls up from modules
 Program progress rolls up from courses
 Credits awarded on completion
 Certificates generated
 No duplicate credit awards


🎯 DELIVERABLES

Supabase Migration Files:

001_create_skills_and_outcomes.sql
002_create_creators.sql
003_create_content_tables.sql
004_create_credit_system.sql
005_create_scholarship_system.sql
006_create_enrollment_tables.sql
007_create_progress_tracking.sql
008_create_certificates.sql
009_create_functions_and_triggers.sql
010_create_rls_policies.sql
011_seed_initial_data.sql


Admin Portal Pages (in /app/cmd/learning/):

All 11 pages with full CRUD functionality
Matching Luna design system
Responsive layouts
Accessible components


Reusable Components (in /components/):

Multi-select dropdown
Content builder
SCORM upload
Progress indicators
Credit balance widget


Server Actions (in /app/actions/):

lms-actions.ts - All LMS CRUD operations
credit-actions.ts - Credit transactions
scholarship-actions.ts - Scholarship management
enrollment-actions.ts - Enrollment logic


Documentation:

Database schema diagram
API endpoint documentation
Admin user guide
Developer setup instructions




🔒 SECURITY REQUIREMENTS

Input Validation:

Sanitize all user inputs
Validate file uploads (SCORM packages)
Prevent SQL injection (use parameterized queries)


Authorization:

Only admins can access /app/cmd/learning/* routes
RLS policies enforce data access
API routes check user permissions


File Upload Security:

Scan SCORM packages for malicious code
Limit file sizes (max 100MB per package)
Validate file types
Use signed URLs for downloads


Rate Limiting:

Limit API calls per user
Prevent spam applications/enrollments




📝 TESTING REQUIREMENTS
Unit Tests

Database functions (credit transactions, progress calculations)
Server actions
UI component logic

Integration Tests

Full enrollment flow
Completion and credit award flow
Scholarship application and approval flow
SCORM upload and storage

E2E Tests

Admin creates module → User enrolls → User completes → Credits awarded
User applies for scholarship → Admin approves → User enrolls with discount
User completes program → All certificates issued


🚀 DEPLOYMENT CHECKLIST

 Run all migrations on production Supabase
 Upload seed data
 Test RLS policies in production
 Verify Supabase Storage buckets created
 Set up environment variables
 Deploy Next.js app to Vercel
 Test critical flows in production
 Monitor error logs
 Set up backups


📞 SUPPORT & QUESTIONS
If you encounter any ambiguity or need clarification during development:

Document the question
Make a reasonable assumption based on this brief
Implement with that assumption
Flag for review with Jennine

Priority: Database first, then core CRUD, then business logic, then polish.

Let's build an amazing LMS! 🚀