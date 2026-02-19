-- =====================================================
-- COGNITIVE ASSESSMENT SYSTEM
-- Based on ICAR (International Cognitive Ability Resource)
-- Created: 2026-02-15
-- =====================================================

-- 1. COGNITIVE TEMPLATES (Admin-managed assessment configurations)
CREATE TABLE IF NOT EXISTS cognitive_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  total_questions INTEGER NOT NULL DEFAULT 40,
  time_limit_minutes INTEGER, -- optional overall time limit
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. COGNITIVE QUESTIONS (ICAR items)
CREATE TABLE IF NOT EXISTS cognitive_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES cognitive_templates(id) ON DELETE CASCADE,
  domain TEXT NOT NULL CHECK (domain IN ('verbal', 'numerical', 'abstract', 'attention')),
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice_text', 'multiple_choice_image', 'pattern_match', 'number_sequence')),
  
  -- Question content
  question_text TEXT,
  question_image_url TEXT, -- for visual/pattern questions
  options JSONB NOT NULL, -- array of answer options
  correct_answer TEXT NOT NULL,
  
  -- Timing & difficulty
  suggested_time_seconds INTEGER NOT NULL, -- suggested time (no hard cutoff)
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  
  -- ICAR attribution
  icar_item_id TEXT, -- reference to original ICAR item (e.g., "ICAR-VR-01")
  icar_source TEXT, -- citation/source
  
  -- Metadata
  is_practice BOOLEAN DEFAULT false, -- practice question (with feedback)
  display_order INTEGER NOT NULL,
  explanation TEXT, -- shown in practice questions only
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. COGNITIVE ATTEMPTS (User attempts)
CREATE TABLE IF NOT EXISTS cognitive_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES cognitive_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')) DEFAULT 'in_progress',
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Overall Scores (0-100 scale)
  overall_raw_score DECIMAL(5,2), -- percentage correct
  overall_percentile DECIMAL(5,2), -- compared to ICAR norms
  
  -- Domain Scores (0-100 scale)
  verbal_raw_score DECIMAL(5,2),
  verbal_percentile DECIMAL(5,2),
  numerical_raw_score DECIMAL(5,2),
  numerical_percentile DECIMAL(5,2),
  abstract_raw_score DECIMAL(5,2),
  abstract_percentile DECIMAL(5,2),
  attention_raw_score DECIMAL(5,2),
  attention_percentile DECIMAL(5,2),
  
  -- Metadata
  total_questions INTEGER,
  correct_answers INTEGER,
  total_time_seconds INTEGER, -- total time taken
  average_response_time DECIMAL(6,2), -- average time per question
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COGNITIVE RESPONSES (Individual question responses)
CREATE TABLE IF NOT EXISTS cognitive_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES cognitive_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES cognitive_questions(id) ON DELETE CASCADE,
  
  -- Response data
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_seconds DECIMAL(6,2) NOT NULL, -- precise timing from jsPsych
  
  -- Metadata
  is_practice BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(attempt_id, question_id)
);

-- 5. COGNITIVE INSIGHTS (Generated insights from results)
CREATE TABLE IF NOT EXISTS cognitive_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID REFERENCES cognitive_attempts(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('strength', 'weakness', 'recommendation')),
  domain TEXT CHECK (domain IN ('verbal', 'numerical', 'abstract', 'attention', 'overall')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ICAR NORMATIVE DATA (Percentile lookup tables)
CREATE TABLE IF NOT EXISTS cognitive_norms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain TEXT NOT NULL CHECK (domain IN ('verbal', 'numerical', 'abstract', 'attention', 'overall')),
  raw_score_percentage DECIMAL(5,2) NOT NULL, -- 0-100 (percentage correct)
  percentile DECIMAL(5,2) NOT NULL, -- 0-100 (percentile rank)
  sample_size INTEGER, -- ICAR sample size for this norm
  source TEXT DEFAULT 'ICAR (Condon & Revelle, 2014)',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(domain, raw_score_percentage)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_cognitive_questions_template ON cognitive_questions(template_id);
CREATE INDEX idx_cognitive_questions_domain ON cognitive_questions(domain);
CREATE INDEX idx_cognitive_questions_display_order ON cognitive_questions(display_order);
CREATE INDEX idx_cognitive_attempts_user ON cognitive_attempts(user_id);
CREATE INDEX idx_cognitive_attempts_status ON cognitive_attempts(status);
CREATE INDEX idx_cognitive_responses_attempt ON cognitive_responses(attempt_id);
CREATE INDEX idx_cognitive_insights_attempt ON cognitive_insights(attempt_id);
CREATE INDEX idx_cognitive_norms_domain ON cognitive_norms(domain);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE cognitive_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_norms ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- COGNITIVE TEMPLATES: Public read for active templates
CREATE POLICY "Anyone can view active cognitive templates"
  ON cognitive_templates FOR SELECT
  USING (is_active = true);

-- COGNITIVE QUESTIONS: Public read for questions in active templates
CREATE POLICY "Anyone can view cognitive questions"
  ON cognitive_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cognitive_templates
      WHERE cognitive_templates.id = cognitive_questions.template_id
      AND cognitive_templates.is_active = true
    )
  );

-- COGNITIVE ATTEMPTS: Users can manage their own attempts
CREATE POLICY "Users can view their own cognitive attempts"
  ON cognitive_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cognitive attempts"
  ON cognitive_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cognitive attempts"
  ON cognitive_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- COGNITIVE RESPONSES: Users can manage their own responses
CREATE POLICY "Users can view their own cognitive responses"
  ON cognitive_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cognitive_attempts
      WHERE cognitive_attempts.id = cognitive_responses.attempt_id
      AND cognitive_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own cognitive responses"
  ON cognitive_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cognitive_attempts
      WHERE cognitive_attempts.id = cognitive_responses.attempt_id
      AND cognitive_attempts.user_id = auth.uid()
    )
  );

-- COGNITIVE INSIGHTS: Users can view their own insights
CREATE POLICY "Users can view their own cognitive insights"
  ON cognitive_insights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cognitive_attempts
      WHERE cognitive_attempts.id = cognitive_insights.attempt_id
      AND cognitive_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create cognitive insights"
  ON cognitive_insights FOR INSERT
  WITH CHECK (true); -- API will create insights after scoring

-- COGNITIVE NORMS: Public read (everyone can see normative data)
CREATE POLICY "Anyone can view cognitive norms"
  ON cognitive_norms FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cognitive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cognitive_templates_updated_at
  BEFORE UPDATE ON cognitive_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_questions_updated_at
  BEFORE UPDATE ON cognitive_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_cognitive_updated_at();

CREATE TRIGGER update_cognitive_attempts_updated_at
  BEFORE UPDATE ON cognitive_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_cognitive_updated_at();

