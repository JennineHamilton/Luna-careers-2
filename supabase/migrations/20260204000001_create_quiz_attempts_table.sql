-- =====================================================
-- Quiz Attempts Table
-- =====================================================
-- Purpose: Track all quiz attempts for retake functionality
-- Date: 2026-02-04
-- Description: Stores individual quiz attempts with scores,
--              pass/fail status, and full SCORM data for history

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  
  -- Score data
  score_raw DECIMAL(5,2),
  score_min DECIMAL(5,2),
  score_max DECIMAL(5,2),
  score_scaled DECIMAL(5,2),
  passing_score DECIMAL(5,2),
  passed BOOLEAN DEFAULT false,
  
  -- Status tracking
  completion_status VARCHAR(20) DEFAULT 'incomplete', -- 'completed', 'incomplete', 'passed', 'failed'
  success_status VARCHAR(20) DEFAULT 'unknown', -- 'passed', 'failed', 'unknown'
  
  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,
  
  -- SCORM data storage
  scorm_cmi_data JSONB DEFAULT '{}'::jsonb, -- Full SCORM CMI data for this attempt
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Ensure unique attempt numbers per user per lesson
  UNIQUE(user_id, lesson_id, attempt_number)
);

-- Indexes for performance
CREATE INDEX idx_quiz_attempts_user_lesson ON quiz_attempts(user_id, lesson_id);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_lesson ON quiz_attempts(lesson_id);
CREATE INDEX idx_quiz_attempts_created ON quiz_attempts(created_at DESC);
CREATE INDEX idx_quiz_attempts_passed ON quiz_attempts(passed);

-- Comments
COMMENT ON TABLE quiz_attempts IS 'Stores all quiz attempts for retake functionality and history tracking';
COMMENT ON COLUMN quiz_attempts.attempt_number IS 'Sequential attempt number for this user and lesson (1, 2, 3, etc.)';
COMMENT ON COLUMN quiz_attempts.passed IS 'Whether this attempt passed based on passing_score threshold';
COMMENT ON COLUMN quiz_attempts.scorm_cmi_data IS 'Complete SCORM CMI data snapshot for this attempt';

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own quiz attempts
CREATE POLICY "Users can view their own quiz attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert their own quiz attempts"
ON quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Platform admins can view all quiz attempts
CREATE POLICY "Platform admins can view all quiz attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
);

-- Platform admins can update quiz attempts (for corrections)
CREATE POLICY "Platform admins can update quiz attempts"
ON quiz_attempts FOR UPDATE
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'platform_admin'
);

-- =====================================================
-- Helper Function: Get Next Attempt Number
-- =====================================================

CREATE OR REPLACE FUNCTION get_next_attempt_number(p_user_id UUID, p_lesson_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_attempt INTEGER;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO v_next_attempt
  FROM quiz_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;
  
  RETURN v_next_attempt;
END;
$$;

COMMENT ON FUNCTION get_next_attempt_number IS 'Returns the next attempt number for a user and lesson';

-- =====================================================
-- Helper Function: Get Latest Quiz Attempt
-- =====================================================

CREATE OR REPLACE FUNCTION get_latest_quiz_attempt(p_user_id UUID, p_lesson_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt quiz_attempts;
BEGIN
  SELECT *
  INTO v_attempt
  FROM quiz_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
  ORDER BY attempt_number DESC
  LIMIT 1;
  
  RETURN v_attempt;
END;
$$;

COMMENT ON FUNCTION get_latest_quiz_attempt IS 'Returns the most recent quiz attempt for a user and lesson';

-- =====================================================
-- Helper Function: Get Best Quiz Attempt
-- =====================================================

CREATE OR REPLACE FUNCTION get_best_quiz_attempt(p_user_id UUID, p_lesson_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt quiz_attempts;
BEGIN
  SELECT *
  INTO v_attempt
  FROM quiz_attempts
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id
  ORDER BY score_raw DESC NULLS LAST, attempt_number DESC
  LIMIT 1;
  
  RETURN v_attempt;
END;
$$;

COMMENT ON FUNCTION get_best_quiz_attempt IS 'Returns the highest scoring quiz attempt for a user and lesson';

