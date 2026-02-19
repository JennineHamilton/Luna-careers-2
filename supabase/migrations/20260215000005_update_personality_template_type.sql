-- =====================================================
-- Update Professional Personality Profile to use 'soft_skills' type
-- Corrects the assessment_type from 'typing' to 'soft_skills'
-- =====================================================

-- Update the personality assessment template to use correct type
UPDATE assessment_templates
SET 
  assessment_type = 'soft_skills',
  updated_at = NOW()
WHERE 
  title = 'Professional Personality Profile'
  AND is_system_managed = true;

-- Verify the update
DO $$
DECLARE
  template_type TEXT;
BEGIN
  SELECT assessment_type INTO template_type
  FROM assessment_templates
  WHERE title = 'Professional Personality Profile'
  AND is_system_managed = true;
  
  IF template_type = 'soft_skills' THEN
    RAISE NOTICE 'Successfully updated Professional Personality Profile to soft_skills type';
  ELSE
    RAISE EXCEPTION 'Failed to update assessment type. Current type: %', template_type;
  END IF;
END $$;

