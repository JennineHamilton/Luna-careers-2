-- Add salary_period to vacancies so salary display can show correct period (hourly, monthly, yearly)
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS salary_period TEXT DEFAULT 'monthly'
CHECK (salary_period IN ('hourly', 'monthly', 'yearly'));

COMMENT ON COLUMN public.vacancies.salary_period IS 'Pay period for salary range: hourly, monthly, or yearly';
