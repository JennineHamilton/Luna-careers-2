-- =====================================================
-- Knowledge Assessment System Migration
-- =====================================================
-- This migration creates tables for the knowledge/skill test engine
-- Supports: True/False, Single Select, Multiple Select questions
-- Features: Random question selection, time limits, passing thresholds

-- =====================================================
-- 1. KNOWLEDGE ASSESSMENTS TABLE
-- =====================================================
-- Stores assessment templates (e.g., "Cybersecurity Basics", "Excel Proficiency")
CREATE TABLE IF NOT EXISTS knowledge_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g., 'cybersecurity', 'excel', 'internet_basics'
  
  -- Configuration
  total_questions_in_pool INTEGER NOT NULL DEFAULT 0, -- Total questions created for this assessment
  questions_per_attempt INTEGER NOT NULL DEFAULT 10, -- How many questions to randomly serve per attempt
  passing_threshold INTEGER NOT NULL DEFAULT 70, -- Percentage required to pass (0-100)
  time_limit_minutes INTEGER NOT NULL DEFAULT 30, -- Time limit in minutes
  allow_review BOOLEAN NOT NULL DEFAULT true, -- Allow users to review and change answers before submitting
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_questions_per_attempt CHECK (questions_per_attempt > 0 AND questions_per_attempt <= total_questions_in_pool),
  CONSTRAINT valid_passing_threshold CHECK (passing_threshold >= 0 AND passing_threshold <= 100),
  CONSTRAINT valid_time_limit CHECK (time_limit_minutes > 0)
);

-- Indexes
CREATE INDEX idx_knowledge_assessments_category ON knowledge_assessments(category);
CREATE INDEX idx_knowledge_assessments_is_published ON knowledge_assessments(is_published);
CREATE INDEX idx_knowledge_assessments_created_by ON knowledge_assessments(created_by);

-- =====================================================
-- 2. KNOWLEDGE QUESTIONS TABLE
-- =====================================================
-- Stores questions belonging to each assessment
CREATE TABLE IF NOT EXISTS knowledge_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  assessment_id UUID NOT NULL REFERENCES knowledge_assessments(id) ON DELETE CASCADE,
  
  -- Question Content
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'true_false', 'single_select', 'multiple_select'
  image_url TEXT, -- Optional image for the question
  
  -- Metadata
  order_index INTEGER NOT NULL DEFAULT 0, -- For ordering questions in admin view
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_question_type CHECK (question_type IN ('true_false', 'single_select', 'multiple_select'))
);

-- Indexes
CREATE INDEX idx_knowledge_questions_assessment_id ON knowledge_questions(assessment_id);
CREATE INDEX idx_knowledge_questions_order ON knowledge_questions(assessment_id, order_index);

-- =====================================================
-- 3. KNOWLEDGE QUESTION OPTIONS TABLE
-- =====================================================
-- Stores answer choices for Select/Multiple Select questions
-- For True/False, we don't need this table (hardcoded True/False options)
CREATE TABLE IF NOT EXISTS knowledge_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationship
  question_id UUID NOT NULL REFERENCES knowledge_questions(id) ON DELETE CASCADE,
  
  -- Option Content
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0, -- For ordering options
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_question_options_question_id ON knowledge_question_options(question_id);
CREATE INDEX idx_knowledge_question_options_order ON knowledge_question_options(question_id, order_index);

-- =====================================================
-- 4. KNOWLEDGE ATTEMPTS TABLE
-- =====================================================
-- Stores user attempt records
CREATE TABLE IF NOT EXISTS knowledge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES knowledge_assessments(id) ON DELETE CASCADE,
  
  -- Attempt Details
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken_seconds INTEGER, -- Actual time taken
  
  -- Scoring
  total_questions INTEGER NOT NULL, -- Number of questions in this attempt
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2), -- Calculated: (correct_answers / total_questions) * 100
  passed BOOLEAN, -- Whether user passed based on threshold
  
  -- Question Selection (stored as array of question IDs for this attempt)
  selected_question_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Display on Profile
  display_on_profile BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Indexes
CREATE INDEX idx_knowledge_attempts_user_id ON knowledge_attempts(user_id);
CREATE INDEX idx_knowledge_attempts_assessment_id ON knowledge_attempts(assessment_id);
CREATE INDEX idx_knowledge_attempts_status ON knowledge_attempts(status);
CREATE INDEX idx_knowledge_attempts_display_on_profile ON knowledge_attempts(user_id, display_on_profile);

-- =====================================================
-- 5. KNOWLEDGE ATTEMPT ANSWERS TABLE
-- =====================================================
-- Stores user's answers for each question in an attempt
CREATE TABLE IF NOT EXISTS knowledge_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  attempt_id UUID NOT NULL REFERENCES knowledge_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES knowledge_questions(id) ON DELETE CASCADE,

  -- Answer Data
  -- For True/False: selected_option_ids will contain a single boolean value stored as text
  -- For Single Select: selected_option_ids will contain one option ID
  -- For Multiple Select: selected_option_ids will contain multiple option IDs
  selected_option_ids UUID[] NOT NULL DEFAULT '{}',
  selected_boolean BOOLEAN, -- For true/false questions

  -- Scoring
  is_correct BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_attempt_question UNIQUE(attempt_id, question_id)
);

-- Indexes
CREATE INDEX idx_knowledge_attempt_answers_attempt_id ON knowledge_attempt_answers(attempt_id);
CREATE INDEX idx_knowledge_attempt_answers_question_id ON knowledge_attempt_answers(question_id);

-- =====================================================
-- 6. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =====================================================

-- Update updated_at timestamp for knowledge_assessments
CREATE OR REPLACE FUNCTION update_knowledge_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_assessments_updated_at
  BEFORE UPDATE ON knowledge_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_assessments_updated_at();

-- Update updated_at timestamp for knowledge_questions
CREATE OR REPLACE FUNCTION update_knowledge_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_questions_updated_at
  BEFORE UPDATE ON knowledge_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_questions_updated_at();

-- Update updated_at timestamp for knowledge_attempts
CREATE OR REPLACE FUNCTION update_knowledge_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_attempts_updated_at
  BEFORE UPDATE ON knowledge_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_attempts_updated_at();

-- =====================================================
-- 7. TRIGGER TO UPDATE total_questions_in_pool
-- =====================================================
-- Automatically update the count when questions are added/removed

CREATE OR REPLACE FUNCTION update_assessment_question_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_assessments
    SET total_questions_in_pool = total_questions_in_pool + 1
    WHERE id = NEW.assessment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_assessments
    SET total_questions_in_pool = GREATEST(0, total_questions_in_pool - 1)
    WHERE id = OLD.assessment_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assessment_question_count
  AFTER INSERT OR DELETE ON knowledge_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_question_count();

-- =====================================================
-- 8. TRIGGER TO AUTO-SET display_on_profile
-- =====================================================
-- Automatically set the best attempt as display_on_profile
-- Best = highest score, or most recent if tied

CREATE OR REPLACE FUNCTION update_knowledge_display_on_profile()
RETURNS TRIGGER AS $$
DECLARE
  best_attempt_id UUID;
BEGIN
  -- Only process if the attempt is completed
  IF NEW.status = 'completed' AND
     (TG_OP = 'INSERT' OR OLD.status != NEW.status) THEN

    -- Find the best attempt (highest score, then most recent)
    SELECT id INTO best_attempt_id
    FROM knowledge_attempts
    WHERE user_id = NEW.user_id
      AND assessment_id = NEW.assessment_id
      AND status = 'completed'
    ORDER BY
      score_percentage DESC NULLS LAST,
      completed_at DESC
    LIMIT 1;

    -- Clear all display_on_profile for this user and assessment
    UPDATE knowledge_attempts
    SET display_on_profile = false
    WHERE user_id = NEW.user_id
      AND assessment_id = NEW.assessment_id
      AND display_on_profile = true;

    -- Set display_on_profile for the best attempt
    UPDATE knowledge_attempts
    SET display_on_profile = true
    WHERE id = best_attempt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_display_on_profile
  AFTER INSERT OR UPDATE ON knowledge_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_display_on_profile();

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE knowledge_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_attempt_answers ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_assessments
-- Admins can do everything
CREATE POLICY "Admins can manage knowledge assessments"
  ON knowledge_assessments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Users can view published assessments
CREATE POLICY "Users can view published knowledge assessments"
  ON knowledge_assessments
  FOR SELECT
  USING (is_published = true);

-- Policies for knowledge_questions
-- Admins can manage questions
CREATE POLICY "Admins can manage knowledge questions"
  ON knowledge_questions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Users can view questions for published assessments
CREATE POLICY "Users can view questions for published assessments"
  ON knowledge_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_assessments
      WHERE knowledge_assessments.id = knowledge_questions.assessment_id
      AND knowledge_assessments.is_published = true
    )
  );

-- Policies for knowledge_question_options
-- Admins can manage options
CREATE POLICY "Admins can manage knowledge question options"
  ON knowledge_question_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Users can view options for published assessments
CREATE POLICY "Users can view options for published assessments"
  ON knowledge_question_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_questions kq
      JOIN knowledge_assessments ka ON ka.id = kq.assessment_id
      WHERE kq.id = knowledge_question_options.question_id
      AND ka.is_published = true
    )
  );

-- Policies for knowledge_attempts
-- Admins can view all attempts
CREATE POLICY "Admins can view all knowledge attempts"
  ON knowledge_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Users can manage their own attempts
CREATE POLICY "Users can manage their own knowledge attempts"
  ON knowledge_attempts
  FOR ALL
  USING (user_id = auth.uid());

-- Policies for knowledge_attempt_answers
-- Admins can view all answers
CREATE POLICY "Admins can view all knowledge attempt answers"
  ON knowledge_attempt_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.account_type = 'platformAdmin'
    )
  );

-- Users can manage answers for their own attempts
CREATE POLICY "Users can manage their own knowledge attempt answers"
  ON knowledge_attempt_answers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM knowledge_attempts
      WHERE knowledge_attempts.id = knowledge_attempt_answers.attempt_id
      AND knowledge_attempts.user_id = auth.uid()
    )
  );

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE knowledge_assessments IS 'Stores knowledge/skill test assessment templates';
COMMENT ON TABLE knowledge_questions IS 'Stores questions belonging to knowledge assessments';
COMMENT ON TABLE knowledge_question_options IS 'Stores answer choices for select/multiple-select questions';
COMMENT ON TABLE knowledge_attempts IS 'Stores user attempt records for knowledge assessments';
COMMENT ON TABLE knowledge_attempt_answers IS 'Stores user answers for each question in an attempt';

COMMENT ON COLUMN knowledge_assessments.questions_per_attempt IS 'Number of questions randomly selected per attempt';
COMMENT ON COLUMN knowledge_assessments.total_questions_in_pool IS 'Total questions available in the assessment pool';
COMMENT ON COLUMN knowledge_assessments.passing_threshold IS 'Percentage required to pass (0-100)';
COMMENT ON COLUMN knowledge_assessments.time_limit_minutes IS 'Time limit for completing the assessment';
COMMENT ON COLUMN knowledge_assessments.allow_review IS 'Whether users can review and change answers before submitting';

COMMENT ON COLUMN knowledge_questions.question_type IS 'Type: true_false, single_select, or multiple_select';
COMMENT ON COLUMN knowledge_questions.image_url IS 'Optional image URL for visual questions';

COMMENT ON COLUMN knowledge_attempts.selected_question_ids IS 'Array of question IDs randomly selected for this attempt';
COMMENT ON COLUMN knowledge_attempts.display_on_profile IS 'Whether this attempt should be displayed on user profile';

COMMENT ON COLUMN knowledge_attempt_answers.selected_option_ids IS 'Array of selected option IDs (for select questions)';
COMMENT ON COLUMN knowledge_attempt_answers.selected_boolean IS 'Boolean answer for true/false questions';

