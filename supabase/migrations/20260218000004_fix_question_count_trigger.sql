-- =====================================================
-- Fix Question Count Trigger
-- =====================================================
-- This migration fixes the trigger that updates total_questions_in_pool
-- to also adjust questions_per_attempt if it would violate the constraint

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_assessment_question_count ON knowledge_questions;
DROP FUNCTION IF EXISTS update_assessment_question_count();

-- Create improved function that handles the constraint
CREATE OR REPLACE FUNCTION update_assessment_question_count()
RETURNS TRIGGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the count
    UPDATE knowledge_assessments
    SET total_questions_in_pool = total_questions_in_pool + 1
    WHERE id = NEW.assessment_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Calculate new total
    new_total := (
      SELECT GREATEST(0, total_questions_in_pool - 1)
      FROM knowledge_assessments
      WHERE id = OLD.assessment_id
    );
    
    -- Update both total and questions_per_attempt if needed
    UPDATE knowledge_assessments
    SET
      total_questions_in_pool = new_total,
      -- If questions_per_attempt would be greater than new total, reduce it
      -- Allow 0 when there are no questions
      questions_per_attempt = CASE
        WHEN new_total = 0 THEN 0
        ELSE LEAST(questions_per_attempt, new_total)
      END
    WHERE id = OLD.assessment_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_assessment_question_count
  AFTER INSERT OR DELETE ON knowledge_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_question_count();

-- Also temporarily disable the constraint check to allow fixing existing data
ALTER TABLE knowledge_assessments DROP CONSTRAINT IF EXISTS valid_questions_per_attempt;

-- Add it back with updated logic (allow 0 questions)
ALTER TABLE knowledge_assessments ADD CONSTRAINT valid_questions_per_attempt
  CHECK (
    questions_per_attempt >= 0
    AND (
      (total_questions_in_pool = 0 AND questions_per_attempt = 0)
      OR (total_questions_in_pool > 0 AND questions_per_attempt > 0 AND questions_per_attempt <= total_questions_in_pool)
    )
  )
  NOT VALID;

-- Validate the constraint (this will fail if there's existing bad data)
-- First, let's fix any existing bad data
UPDATE knowledge_assessments
SET questions_per_attempt = CASE
  WHEN total_questions_in_pool = 0 THEN 0
  ELSE LEAST(questions_per_attempt, total_questions_in_pool)
END
WHERE questions_per_attempt > total_questions_in_pool OR (total_questions_in_pool = 0 AND questions_per_attempt != 0);

-- Now validate the constraint
ALTER TABLE knowledge_assessments VALIDATE CONSTRAINT valid_questions_per_attempt;

