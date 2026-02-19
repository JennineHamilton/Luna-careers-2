-- =====================================================
-- Add Skill Category Enum Type
-- =====================================================
-- This migration creates an enum type for skill categories
-- and updates the skills table to use it.
-- =====================================================

-- Delete any existing test/invalid data
DELETE FROM skills WHERE category NOT IN (
  'technical',
  'soft_skill',
  'industry_specific',
  'business',
  'creative',
  'data_analytics',
  'leadership',
  'communication',
  'digital_literacy'
);

-- Create enum type for skill categories
CREATE TYPE skill_category AS ENUM (
  'technical',
  'soft_skill',
  'industry_specific',
  'business',
  'creative',
  'data_analytics',
  'leadership',
  'communication',
  'digital_literacy'
);

-- Alter the skills table to use the enum type
ALTER TABLE skills
  ALTER COLUMN category TYPE skill_category
  USING category::skill_category;

-- Add a comment to document the enum values
COMMENT ON TYPE skill_category IS 'Categories for skills: technical (programming, tools), soft_skill (interpersonal), industry_specific (domain knowledge), business (management, strategy), creative (design, content), data_analytics (analysis, visualization), leadership (team management), communication (writing, speaking), digital_literacy (basic tech skills)';

