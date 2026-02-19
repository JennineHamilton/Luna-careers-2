-- =====================================================
-- COGNITIVE ASSESSMENT TEMPLATE SEED
-- Creates the default ICAR-based cognitive assessment template
-- =====================================================

-- Insert default cognitive assessment template
INSERT INTO cognitive_templates (
  id,
  title,
  description,
  total_questions,
  time_limit_minutes,
  is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid, -- Fixed UUID for reference
  'ICAR Cognitive Assessment',
  'Comprehensive cognitive ability assessment based on ICAR (International Cognitive Ability Resource) public domain items. Measures verbal reasoning, numerical reasoning, abstract pattern recognition, and attention to detail.',
  40, -- 10 questions per domain
  NULL, -- No hard time limit (track time but allow completion)
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  total_questions = EXCLUDED.total_questions,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

