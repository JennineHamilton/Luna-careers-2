-- Add SCORM extraction status tracking to lessons table
-- This prevents re-extraction on every page load

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS scorm_extraction_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS scorm_extraction_error TEXT,
ADD COLUMN IF NOT EXISTS scorm_extracted_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_extraction_status ON public.lessons(scorm_extraction_status);

-- Add comments
COMMENT ON COLUMN public.lessons.scorm_extraction_status IS 'Status of SCORM package extraction: pending, extracting, completed, failed';
COMMENT ON COLUMN public.lessons.scorm_extraction_error IS 'Error message if extraction failed';
COMMENT ON COLUMN public.lessons.scorm_extracted_at IS 'Timestamp when SCORM package was successfully extracted';

-- Update existing lessons with scorm_launch_url to mark as completed
UPDATE public.lessons
SET scorm_extraction_status = 'completed',
    scorm_extracted_at = NOW()
WHERE scorm_launch_url IS NOT NULL
  AND scorm_extraction_status = 'pending';

