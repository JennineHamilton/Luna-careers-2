-- =====================================================
-- Add Prerequisites to Vacancies
-- Adds columns to store assessment and learning content prerequisites
-- =====================================================

-- Add prerequisite columns to vacancies table
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS prerequisite_assessments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prerequisite_learning_content JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.vacancies.prerequisite_assessments IS 'Array of assessment IDs that must be completed before applying. Format: [{"id": "uuid", "type": "typing|cognitive|personality|knowledge", "title": "Assessment Name"}]';
COMMENT ON COLUMN public.vacancies.prerequisite_learning_content IS 'Array of learning content that must be completed before applying. Format: [{"id": "uuid", "type": "module|course|program", "title": "Content Name"}]';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vacancies_prerequisite_assessments ON public.vacancies USING GIN (prerequisite_assessments);
CREATE INDEX IF NOT EXISTS idx_vacancies_prerequisite_learning_content ON public.vacancies USING GIN (prerequisite_learning_content);

