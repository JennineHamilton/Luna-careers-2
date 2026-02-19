-- =====================================================
-- Simplify Knowledge Assessment System
-- =====================================================
-- Remove total_questions_in_pool field and all related complexity
-- Keep only questions_per_attempt which defines how many questions to serve per attempt

-- Drop the trigger that auto-updates question counts
DROP TRIGGER IF EXISTS update_question_count_trigger ON knowledge_questions;
DROP TRIGGER IF EXISTS trigger_update_assessment_question_count ON knowledge_questions;
DROP FUNCTION IF EXISTS update_assessment_question_count() CASCADE;

-- Drop the constraint that validates questions_per_attempt against total_questions_in_pool
ALTER TABLE knowledge_assessments DROP CONSTRAINT IF EXISTS valid_questions_per_attempt;

-- Drop the total_questions_in_pool column (we'll count dynamically when needed)
ALTER TABLE knowledge_assessments DROP COLUMN IF EXISTS total_questions_in_pool;

-- Add a simple constraint: questions_per_attempt must be positive
ALTER TABLE knowledge_assessments ADD CONSTRAINT positive_questions_per_attempt
  CHECK (questions_per_attempt > 0);

-- Add comment explaining the simplified logic
COMMENT ON COLUMN knowledge_assessments.questions_per_attempt IS 
  'Number of questions to randomly select from the question pool for each user attempt. The system will randomly pick this many questions from all available questions in the assessment.';

