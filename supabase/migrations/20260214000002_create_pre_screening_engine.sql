-- =====================================================
-- Pre-Screening Assessment Engine
-- =====================================================
-- This migration creates the pre-screening assessment system
-- for measuring and showcasing candidate skills (typing, transcription, etc.)
--
-- Tables:
-- 1. assessment_templates - Admin-created assessment types
-- 2. assessment_attempts - User attempts at assessments
-- 3. user_skill_badges - Computed badges from best attempts
-- =====================================================

-- =====================================================
-- Table 1: assessment_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('typing', 'transcription', 'multilingual')),
  
  -- Configuration
  language TEXT NOT NULL DEFAULT 'en',
  duration_seconds INTEGER NOT NULL DEFAULT 60,
  
  -- Audio (for transcription tests)
  has_audio BOOLEAN DEFAULT false,
  audio_url TEXT,
  
  -- AI Generation
  passage_generation_prompt TEXT,
  
  -- Display
  icon TEXT DEFAULT 'Keyboard',
  category TEXT DEFAULT 'typing',
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table 2: assessment_attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  
  -- Test Content
  passage_used TEXT NOT NULL,
  user_input TEXT,
  
  -- Performance Metrics
  wpm INTEGER,
  accuracy DECIMAL(5,2),
  time_taken INTEGER,
  errors_count INTEGER DEFAULT 0,
  characters_typed INTEGER DEFAULT 0,
  correct_characters INTEGER DEFAULT 0,
  
  -- AI-Generated Insights
  performance_report TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')),
  skill_level_numeric INTEGER CHECK (skill_level_numeric BETWEEN 1 AND 5),
  
  -- Status Tracking
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted', 'abandoned')),
  is_submitted BOOLEAN DEFAULT false,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ
);

-- =====================================================
-- Table 3: user_skill_badges
-- =====================================================
CREATE TABLE IF NOT EXISTS user_skill_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE CASCADE,
  
  -- Best Performance
  best_attempt_id UUID REFERENCES assessment_attempts(id) ON DELETE SET NULL,
  best_wpm INTEGER,
  best_accuracy DECIMAL(5,2),
  
  -- Badge Info
  badge_level TEXT NOT NULL CHECK (badge_level IN ('beginner', 'intermediate', 'advanced', 'expert', 'master')),
  badge_level_numeric INTEGER NOT NULL CHECK (badge_level_numeric BETWEEN 1 AND 5),
  badge_color TEXT,
  
  -- Display on Profile
  display_on_profile BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one badge per user per assessment type
  UNIQUE(user_id, assessment_template_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_template ON assessment_attempts(assessment_template_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_submitted ON assessment_attempts(user_id, is_submitted) WHERE is_submitted = true;
CREATE INDEX IF NOT EXISTS idx_user_skill_badges_user ON user_skill_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_badges_display ON user_skill_badges(user_id, display_on_profile) WHERE display_on_profile = true;

-- =====================================================
-- Updated At Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON assessment_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skill_badges_updated_at
  BEFORE UPDATE ON user_skill_badges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skill_badges ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- assessment_templates Policies
-- =====================================================

-- Platform admins can do everything
CREATE POLICY "Platform admins can manage assessment templates"
  ON assessment_templates
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- Everyone can view active templates
CREATE POLICY "Anyone can view active assessment templates"
  ON assessment_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- assessment_attempts Policies
-- =====================================================

-- Users can view their own attempts
CREATE POLICY "Users can view their own attempts"
  ON assessment_attempts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create their own attempts
CREATE POLICY "Users can create their own attempts"
  ON assessment_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attempts (before submission)
CREATE POLICY "Users can update their own attempts"
  ON assessment_attempts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Platform admins can view all attempts
CREATE POLICY "Platform admins can view all attempts"
  ON assessment_attempts
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- =====================================================
-- user_skill_badges Policies
-- =====================================================

-- Users can view their own badges
CREATE POLICY "Users can view their own badges"
  ON user_skill_badges
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can view badges that are set to display on profile
CREATE POLICY "Anyone can view public badges"
  ON user_skill_badges
  FOR SELECT
  TO authenticated
  USING (display_on_profile = true);

-- Users can update their own badge display settings
CREATE POLICY "Users can update their own badge settings"
  ON user_skill_badges
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert/update badges (via API with service role)
-- Platform admins can manage all badges
CREATE POLICY "Platform admins can manage all badges"
  ON user_skill_badges
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'account_type') = 'platformAdmin'
  );

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate skill level from WPM and accuracy
CREATE OR REPLACE FUNCTION calculate_skill_level(wpm INTEGER, accuracy DECIMAL)
RETURNS TABLE(level TEXT, level_numeric INTEGER, color TEXT) AS $$
DECLARE
  base_level DECIMAL;
  final_level INTEGER;
BEGIN
  -- Base level from WPM
  IF wpm >= 81 THEN
    base_level := 5;
  ELSIF wpm >= 61 THEN
    base_level := 4;
  ELSIF wpm >= 41 THEN
    base_level := 3;
  ELSIF wpm >= 26 THEN
    base_level := 2;
  ELSE
    base_level := 1;
  END IF;

  -- Accuracy modifier
  IF accuracy < 70 THEN
    base_level := base_level - 1.5;
  ELSIF accuracy < 80 THEN
    base_level := base_level - 1;
  ELSIF accuracy < 90 THEN
    base_level := base_level - 0.5;
  END IF;

  -- Round to nearest integer and clamp between 1-5
  final_level := GREATEST(1, LEAST(5, ROUND(base_level)));

  -- Return level info
  RETURN QUERY SELECT
    CASE final_level
      WHEN 1 THEN 'beginner'::TEXT
      WHEN 2 THEN 'intermediate'::TEXT
      WHEN 3 THEN 'advanced'::TEXT
      WHEN 4 THEN 'expert'::TEXT
      WHEN 5 THEN 'master'::TEXT
    END,
    final_level,
    CASE final_level
      WHEN 1 THEN '#6B7280'::TEXT
      WHEN 2 THEN '#3B82F6'::TEXT
      WHEN 3 THEN '#10B981'::TEXT
      WHEN 4 THEN '#8B5CF6'::TEXT
      WHEN 5 THEN '#F59E0B'::TEXT
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

