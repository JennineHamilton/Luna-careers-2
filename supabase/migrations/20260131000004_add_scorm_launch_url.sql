-- Add scorm_launch_url column to lessons table
-- This stores the relative path to the extracted SCORM content's launch file

ALTER TABLE public.lessons
ADD COLUMN IF NOT EXISTS scorm_launch_url TEXT;

COMMENT ON COLUMN public.lessons.scorm_launch_url IS 'Relative path to the extracted SCORM content launch file (e.g., /scorm/lesson-id/index.html)';

