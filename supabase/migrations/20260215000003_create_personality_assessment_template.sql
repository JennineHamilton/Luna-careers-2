-- =====================================================
-- Create System-Managed "Professional Personality Profile" Assessment
-- This assessment cannot be edited or deleted by admins
-- =====================================================

-- First, add is_system_managed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assessment_templates'
    AND column_name = 'is_system_managed'
  ) THEN
    ALTER TABLE assessment_templates ADD COLUMN is_system_managed BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_system_managed column to assessment_templates';
  END IF;
END $$;

-- Insert the system-managed personality assessment template
-- Note: Using 'typing' as assessment_type since 'personality' is not in the enum
-- This is a placeholder - personality assessments work differently
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
  created_at,
  updated_at
) VALUES (
  'Professional Personality Profile',
  'A scientifically validated Big Five personality assessment that provides comprehensive workplace insights. This 50-question assessment takes 10-15 minutes to complete and generates four detailed reports: Employee Personality Profile, Work Style Insights, Job Family Recommendations, and Development Areas. Based on the IPIP-50 instrument (Goldberg, 1992) with research-backed interpretations.',
  'typing',  -- Placeholder type
  'en',
  900,  -- 15 minutes (900 seconds)
  false,
  'personality',
  true,  -- System-managed: admin cannot edit name or delete
  true,  -- Active by default
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
  WHERE title = 'Professional Personality Profile'
  AND is_system_managed = true;

  IF template_count = 0 THEN
    RAISE EXCEPTION 'Failed to create Professional Personality Profile template';
  END IF;

  RAISE NOTICE 'Successfully created system-managed Professional Personality Profile assessment template';
END $$;

