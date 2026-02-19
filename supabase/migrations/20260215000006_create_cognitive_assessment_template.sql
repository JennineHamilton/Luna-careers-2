-- =====================================================
-- Create System-Managed "ICAR Cognitive Assessment" Template
-- This assessment cannot be edited or deleted by admins
-- =====================================================

-- Insert the system-managed cognitive assessment template
INSERT INTO assessment_templates (
  title,
  description,
  assessment_type,
  language,
  duration_seconds,
  has_audio,
  category,
  is_system_managed,
  is_active,
  icon,
  display_order,
  created_at,
  updated_at
) VALUES (
  'ICAR Cognitive Assessment',
  'A scientifically validated cognitive ability assessment based on the International Cognitive Ability Resource (ICAR). This 40-question assessment measures four key cognitive domains: Verbal Reasoning, Numerical Reasoning, Abstract/Pattern Recognition, and Attention to Detail. Takes 15-20 minutes to complete and provides percentile rankings based on research norms.',
  'soft_skills',  -- Grouped with personality under soft skills
  'en',
  1200,  -- 20 minutes (1200 seconds)
  false,
  'cognitive',
  true,  -- System-managed: admin cannot edit or delete
  true,  -- Active by default
  'Brain',
  1,  -- Display order (after personality)
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Verify the template was created
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count
  FROM assessment_templates
  WHERE title = 'ICAR Cognitive Assessment'
  AND is_system_managed = true;

  IF template_count = 0 THEN
    RAISE EXCEPTION 'Failed to create ICAR Cognitive Assessment template';
  END IF;

  RAISE NOTICE 'Successfully created system-managed ICAR Cognitive Assessment template';
END $$;

