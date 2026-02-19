-- Update job_applications table to support profile-based application flow
-- Remove cover_letter and resume_url fields (no longer needed)
-- Add consent_given field to track user consent for profile sharing

-- Drop the cover_letter column
ALTER TABLE public.job_applications
DROP COLUMN IF EXISTS cover_letter;

-- Drop the resume_url column
ALTER TABLE public.job_applications
DROP COLUMN IF EXISTS resume_url;

-- Add consent_given column
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS consent_given BOOLEAN NOT NULL DEFAULT false;

-- Add comment to explain the consent field
COMMENT ON COLUMN public.job_applications.consent_given IS 'User consent to share their professional profile with the employer';

