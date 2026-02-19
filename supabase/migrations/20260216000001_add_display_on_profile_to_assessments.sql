-- Add display_on_profile field to assessment tables
-- This field indicates which attempt should be displayed on the user's profile

-- 1. Add to assessment_attempts (typing/transcription)
ALTER TABLE assessment_attempts
ADD COLUMN IF NOT EXISTS display_on_profile BOOLEAN DEFAULT false;

-- 2. Add to personality_attempts
ALTER TABLE personality_attempts
ADD COLUMN IF NOT EXISTS display_on_profile BOOLEAN DEFAULT false;

-- 3. Add to cognitive_attempts
ALTER TABLE cognitive_attempts
ADD COLUMN IF NOT EXISTS display_on_profile BOOLEAN DEFAULT false;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_display_on_profile 
ON assessment_attempts(user_id, display_on_profile) 
WHERE display_on_profile = true;

CREATE INDEX IF NOT EXISTS idx_personality_attempts_display_on_profile 
ON personality_attempts(user_id, display_on_profile) 
WHERE display_on_profile = true;

CREATE INDEX IF NOT EXISTS idx_cognitive_attempts_display_on_profile 
ON cognitive_attempts(user_id, display_on_profile) 
WHERE display_on_profile = true;

-- Function to automatically set display_on_profile for the best attempt
-- This will be called when a new attempt is submitted

-- For typing assessments: best = highest WPM with good accuracy (>90%)
CREATE OR REPLACE FUNCTION update_typing_display_on_profile()
RETURNS TRIGGER AS $$
DECLARE
  best_attempt_id UUID;
BEGIN
  -- Only process if the attempt is completed and submitted
  -- AND if this is not just a display_on_profile update (prevent recursion)
  IF NEW.status = 'completed' AND NEW.is_submitted = true AND
     (TG_OP = 'INSERT' OR OLD.status != NEW.status OR OLD.is_submitted != NEW.is_submitted) THEN

    -- Find the best attempt
    SELECT id INTO best_attempt_id
    FROM assessment_attempts
    WHERE user_id = NEW.user_id
      AND assessment_template_id = NEW.assessment_template_id
      AND status = 'completed'
      AND is_submitted = true
    ORDER BY
      CASE WHEN accuracy >= 90 THEN 1 ELSE 2 END,
      wpm DESC NULLS LAST
    LIMIT 1;

    -- Clear all display_on_profile for this user and assessment template
    UPDATE assessment_attempts
    SET display_on_profile = false
    WHERE user_id = NEW.user_id
      AND assessment_template_id = NEW.assessment_template_id
      AND display_on_profile = true;

    -- Set display_on_profile for the best attempt
    UPDATE assessment_attempts
    SET display_on_profile = true
    WHERE id = best_attempt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For personality assessments: use the most recent completed attempt
CREATE OR REPLACE FUNCTION update_personality_display_on_profile()
RETURNS TRIGGER AS $$
DECLARE
  best_attempt_id UUID;
BEGIN
  -- Only process if the attempt is completed
  -- AND if this is not just a display_on_profile update (prevent recursion)
  IF NEW.status = 'completed' AND
     (TG_OP = 'INSERT' OR OLD.status != NEW.status) THEN

    -- Find the most recent completed attempt
    SELECT id INTO best_attempt_id
    FROM personality_attempts
    WHERE user_id = NEW.user_id
      AND status = 'completed'
    ORDER BY completed_at DESC NULLS LAST
    LIMIT 1;

    -- Clear all display_on_profile for this user
    UPDATE personality_attempts
    SET display_on_profile = false
    WHERE user_id = NEW.user_id
      AND display_on_profile = true;

    -- Set display_on_profile for the most recent completed attempt
    UPDATE personality_attempts
    SET display_on_profile = true
    WHERE id = best_attempt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- For cognitive assessments: use the highest overall percentile
CREATE OR REPLACE FUNCTION update_cognitive_display_on_profile()
RETURNS TRIGGER AS $$
DECLARE
  best_attempt_id UUID;
BEGIN
  -- Only process if the attempt is completed
  -- AND if this is not just a display_on_profile update (prevent recursion)
  IF NEW.status = 'completed' AND
     (TG_OP = 'INSERT' OR OLD.status != NEW.status) THEN

    -- Find the best attempt (highest overall percentile)
    SELECT id INTO best_attempt_id
    FROM cognitive_attempts
    WHERE user_id = NEW.user_id
      AND template_id = NEW.template_id
      AND status = 'completed'
    ORDER BY overall_percentile DESC NULLS LAST
    LIMIT 1;

    -- Clear all display_on_profile for this user and template
    UPDATE cognitive_attempts
    SET display_on_profile = false
    WHERE user_id = NEW.user_id
      AND template_id = NEW.template_id
      AND display_on_profile = true;

    -- Set display_on_profile for the best attempt
    UPDATE cognitive_attempts
    SET display_on_profile = true
    WHERE id = best_attempt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_typing_display_on_profile ON assessment_attempts;
CREATE TRIGGER trigger_update_typing_display_on_profile
  AFTER INSERT OR UPDATE ON assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_typing_display_on_profile();

DROP TRIGGER IF EXISTS trigger_update_personality_display_on_profile ON personality_attempts;
CREATE TRIGGER trigger_update_personality_display_on_profile
  AFTER INSERT OR UPDATE ON personality_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_personality_display_on_profile();

DROP TRIGGER IF EXISTS trigger_update_cognitive_display_on_profile ON cognitive_attempts;
CREATE TRIGGER trigger_update_cognitive_display_on_profile
  AFTER INSERT OR UPDATE ON cognitive_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_cognitive_display_on_profile();

-- Backfill existing data: set display_on_profile for best existing attempts
-- Typing assessments
UPDATE assessment_attempts a1
SET display_on_profile = true
WHERE id IN (
  SELECT DISTINCT ON (user_id, assessment_template_id) id
  FROM assessment_attempts
  WHERE status = 'completed' AND is_submitted = true
  ORDER BY user_id, assessment_template_id, 
    CASE WHEN accuracy >= 90 THEN 1 ELSE 2 END,
    wpm DESC NULLS LAST
);

-- Personality assessments
UPDATE personality_attempts p1
SET display_on_profile = true
WHERE id IN (
  SELECT DISTINCT ON (user_id) id
  FROM personality_attempts
  WHERE status = 'completed'
  ORDER BY user_id, completed_at DESC NULLS LAST
);

-- Cognitive assessments
UPDATE cognitive_attempts c1
SET display_on_profile = true
WHERE id IN (
  SELECT DISTINCT ON (user_id, template_id) id
  FROM cognitive_attempts
  WHERE status = 'completed'
  ORDER BY user_id, template_id, overall_percentile DESC NULLS LAST
);

