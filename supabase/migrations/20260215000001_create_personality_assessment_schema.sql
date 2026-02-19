-- =====================================================
-- Professional Personality Profile - Database Schema
-- Based on IPIP-50 (Goldberg, 1992)
-- Validated Big Five personality assessment
-- =====================================================

-- 1. Personality Questions Table (IPIP-50 validated items)
CREATE TABLE IF NOT EXISTS personality_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_number INTEGER NOT NULL UNIQUE CHECK (question_number BETWEEN 1 AND 50),
  question_text TEXT NOT NULL,
  dimension TEXT NOT NULL CHECK (dimension IN ('extraversion', 'agreeableness', 'conscientiousness', 'emotional_stability', 'intellect')),
  is_reversed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata for validation
  source TEXT DEFAULT 'IPIP-50 (Goldberg, 1992)',
  validation_status TEXT DEFAULT 'validated'
);

-- 2. Personality Attempts Table
CREATE TABLE IF NOT EXISTS personality_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_template_id UUID REFERENCES assessment_templates(id),
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'submitted')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  
  -- Raw Big Five scores (0-100 scale)
  extraversion_score DECIMAL(5,2),
  agreeableness_score DECIMAL(5,2),
  conscientiousness_score DECIMAL(5,2),
  emotional_stability_score DECIMAL(5,2),
  intellect_score DECIMAL(5,2),
  
  -- Percentile ranks (compared to normative sample)
  extraversion_percentile INTEGER CHECK (extraversion_percentile BETWEEN 0 AND 100),
  agreeableness_percentile INTEGER CHECK (agreeableness_percentile BETWEEN 0 AND 100),
  conscientiousness_percentile INTEGER CHECK (conscientiousness_percentile BETWEEN 0 AND 100),
  emotional_stability_percentile INTEGER CHECK (emotional_stability_percentile BETWEEN 0 AND 100),
  intellect_percentile INTEGER CHECK (intellect_percentile BETWEEN 0 AND 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Personality Responses Table
CREATE TABLE IF NOT EXISTS personality_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES personality_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES personality_questions(id),
  response_value INTEGER NOT NULL CHECK (response_value BETWEEN 1 AND 5),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(attempt_id, question_id)
);

-- 4. Research-Backed Insights Table
CREATE TABLE IF NOT EXISTS personality_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES personality_attempts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('job_performance', 'career_fit', 'work_style', 'team_dynamics', 'learning_development', 'work_environment', 'development_area')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  research_source TEXT NOT NULL,
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'moderate', 'low')),
  applicable_dimensions JSONB,
  percentile_trigger INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Job Recommendations Table
CREATE TABLE IF NOT EXISTS personality_job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES personality_attempts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_family TEXT NOT NULL,
  match_strength TEXT NOT NULL CHECK (match_strength IN ('strong', 'moderate', 'weak')),
  example_roles JSONB,
  rationale TEXT NOT NULL,
  research_source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Cached Reports Table
CREATE TABLE IF NOT EXISTS personality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES personality_attempts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('personality_profile', 'work_insights', 'job_recommendations', 'development_areas')),
  report_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(attempt_id, report_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_personality_attempts_user_id ON personality_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_attempts_status ON personality_attempts(status);
CREATE INDEX IF NOT EXISTS idx_personality_responses_attempt_id ON personality_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_personality_insights_attempt_id ON personality_insights(attempt_id);
CREATE INDEX IF NOT EXISTS idx_personality_insights_user_id ON personality_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_job_recommendations_attempt_id ON personality_job_recommendations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_personality_reports_attempt_id ON personality_reports(attempt_id);

-- Enable RLS
ALTER TABLE personality_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personality_questions (public read)
CREATE POLICY "Anyone can view personality questions"
  ON personality_questions FOR SELECT
  USING (true);

-- RLS Policies for personality_attempts
CREATE POLICY "Users can view own personality attempts"
  ON personality_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own personality attempts"
  ON personality_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own personality attempts"
  ON personality_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for personality_responses
CREATE POLICY "Users can view own personality responses"
  ON personality_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM personality_attempts
    WHERE personality_attempts.id = personality_responses.attempt_id
    AND personality_attempts.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own personality responses"
  ON personality_responses FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM personality_attempts
    WHERE personality_attempts.id = personality_responses.attempt_id
    AND personality_attempts.user_id = auth.uid()
  ));

-- RLS Policies for personality_insights
CREATE POLICY "Users can view own personality insights"
  ON personality_insights FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for personality_job_recommendations
CREATE POLICY "Users can view own job recommendations"
  ON personality_job_recommendations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for personality_reports
CREATE POLICY "Users can view own personality reports"
  ON personality_reports FOR SELECT
  USING (auth.uid() = user_id);

