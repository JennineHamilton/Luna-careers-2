-- =====================================================
-- Add Soft Skills, Cognitive, and Coding Assessment Types
-- Extends the assessment_type CHECK constraint to support all 4 assessment categories
-- =====================================================

-- Drop the existing CHECK constraint
ALTER TABLE assessment_templates
DROP CONSTRAINT IF EXISTS assessment_templates_assessment_type_check;

-- Add new CHECK constraint with all 4 assessment types
ALTER TABLE assessment_templates
ADD CONSTRAINT assessment_templates_assessment_type_check
CHECK (assessment_type IN ('typing', 'transcription', 'multilingual', 'soft_skills', 'cognitive', 'coding'));

-- Verify the constraint
DO $$
BEGIN
  RAISE NOTICE 'Assessment types now include: typing, transcription, multilingual, soft_skills, cognitive, coding';
END $$;

