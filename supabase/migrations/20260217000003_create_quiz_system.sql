/**
 * Migration: Create Quiz System
 * Creates tables for quiz management, questions, attempts, and module integration
 */

-- Drop old SCORM quiz tables (no longer needed - using new quiz builder instead)
DROP TABLE IF EXISTS quiz_attempts CASCADE;

-- Drop existing quiz builder tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS module_quizzes CASCADE;
DROP TABLE IF EXISTS quiz_attempt_answers CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_question_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;

-- ============================================================
-- Table: quizzes
-- Stores quiz metadata and settings
-- ============================================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  number_of_questions INTEGER NOT NULL CHECK (number_of_questions > 0),
  is_graded BOOLEAN NOT NULL DEFAULT true,
  passing_score INTEGER CHECK (passing_score >= 0 AND passing_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: quiz_questions
-- Stores individual questions for each quiz
-- ============================================================
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('true_false', 'single_choice', 'multiple_choice')),
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: quiz_question_options
-- Stores answer options for each question
-- ============================================================
CREATE TABLE quiz_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: quiz_attempts
-- Stores user attempts at quizzes (allows multiple attempts)
-- ============================================================
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2),
  passed BOOLEAN,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  time_taken_seconds INTEGER
);

-- ============================================================
-- Table: quiz_attempt_answers
-- Stores individual answers for each attempt
-- ============================================================
CREATE TABLE quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_ids UUID[] NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: module_quizzes
-- Junction table linking quizzes to modules
-- ============================================================
CREATE TABLE module_quizzes (
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (module_id, quiz_id)
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_question_options_question_id ON quiz_question_options(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_question_options_order ON quiz_question_options(question_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_answers_attempt_id ON quiz_attempt_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_module_quizzes_module_id ON module_quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_module_quizzes_quiz_id ON module_quizzes(quiz_id);

-- ============================================================
-- RLS Policies
-- ============================================================

-- Quizzes: Platform admins can manage, users can read
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quizzes_read_all ON quizzes
  FOR SELECT USING (true);

CREATE POLICY quizzes_insert_platform_admin ON quizzes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quizzes_update_platform_admin ON quizzes
  FOR UPDATE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quizzes_delete_platform_admin ON quizzes
  FOR DELETE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Quiz Questions: Platform admins can manage, users can read
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_questions_read_all ON quiz_questions
  FOR SELECT USING (true);

CREATE POLICY quiz_questions_insert_platform_admin ON quiz_questions
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quiz_questions_update_platform_admin ON quiz_questions
  FOR UPDATE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quiz_questions_delete_platform_admin ON quiz_questions
  FOR DELETE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Quiz Question Options: Platform admins can manage, users can read
ALTER TABLE quiz_question_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_question_options_read_all ON quiz_question_options
  FOR SELECT USING (true);

CREATE POLICY quiz_question_options_insert_platform_admin ON quiz_question_options
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quiz_question_options_update_platform_admin ON quiz_question_options
  FOR UPDATE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quiz_question_options_delete_platform_admin ON quiz_question_options
  FOR DELETE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Quiz Attempts: Users can read their own, platform admins can read all
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_attempts_read_own ON quiz_attempts
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY quiz_attempts_insert_own ON quiz_attempts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY quiz_attempts_update_own ON quiz_attempts
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Quiz Attempt Answers: Users can read their own, platform admins can read all
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY quiz_attempt_answers_read_own ON quiz_attempt_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND (quiz_attempts.user_id = auth.uid() OR auth.jwt() ->> 'account_type' = 'platformAdmin')
    )
  );

CREATE POLICY quiz_attempt_answers_insert_own ON quiz_attempt_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_attempts
      WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND quiz_attempts.user_id = auth.uid()
    )
  );

-- Module Quizzes: Platform admins can manage, users can read
ALTER TABLE module_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY module_quizzes_read_all ON module_quizzes
  FOR SELECT USING (true);

CREATE POLICY module_quizzes_insert_platform_admin ON module_quizzes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY module_quizzes_update_platform_admin ON module_quizzes
  FOR UPDATE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

CREATE POLICY module_quizzes_delete_platform_admin ON module_quizzes
  FOR DELETE USING (
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- ============================================================
-- Updated at triggers
-- ============================================================
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at
  BEFORE UPDATE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STORAGE BUCKET FOR QUIZ IMAGES
-- =====================================================

-- Create quiz-images bucket (public for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('quiz-images', 'quiz-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for quiz-images bucket

-- Allow platform admins to upload images
CREATE POLICY quiz_images_upload_platform_admin ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow platform admins to update images
CREATE POLICY quiz_images_update_platform_admin ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow platform admins to delete images
CREATE POLICY quiz_images_delete_platform_admin ON storage.objects
  FOR DELETE USING (
    bucket_id = 'quiz-images' AND
    auth.jwt() ->> 'account_type' = 'platformAdmin'
  );

-- Allow everyone to read images (public bucket)
CREATE POLICY quiz_images_read_all ON storage.objects
  FOR SELECT USING (bucket_id = 'quiz-images');

