-- Migration: Handle vacancy deletion gracefully
-- Description: Change CASCADE delete to SET NULL for job_applications.vacancy_id
--              Add is_hidden field to allow users to hide applications for deleted vacancies

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.job_applications
DROP CONSTRAINT IF EXISTS job_applications_vacancy_id_fkey;

-- Step 2: Make vacancy_id nullable (required for SET NULL to work)
ALTER TABLE public.job_applications
ALTER COLUMN vacancy_id DROP NOT NULL;

-- Step 3: Add is_hidden field to job_applications
ALTER TABLE public.job_applications
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Step 4: Re-add the foreign key constraint with SET NULL instead of CASCADE
ALTER TABLE public.job_applications
ADD CONSTRAINT job_applications_vacancy_id_fkey
FOREIGN KEY (vacancy_id)
REFERENCES public.vacancies(id)
ON DELETE SET NULL;

-- Step 5: Create an index on is_hidden for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_is_hidden
ON public.job_applications(is_hidden);

-- Step 6: Add a comment to explain the behavior
COMMENT ON COLUMN public.job_applications.vacancy_id IS
'References the vacancy. Set to NULL when vacancy is deleted to preserve application history.';

COMMENT ON COLUMN public.job_applications.is_hidden IS
'Allows users to hide applications for deleted vacancies from their view.';

