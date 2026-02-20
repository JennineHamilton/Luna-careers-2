-- Job categories for vacancies (e.g. Customer Service, Maintenance, Programming)
CREATE TABLE IF NOT EXISTS public.job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0
);

COMMENT ON TABLE public.job_categories IS 'Categories for job vacancies (Customer Service, Programming, etc.)';

-- Add job_category_id to vacancies
ALTER TABLE public.vacancies
ADD COLUMN IF NOT EXISTS job_category_id UUID REFERENCES public.job_categories(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.vacancies.job_category_id IS 'Optional job category (e.g. Customer Service, Programming)';

-- Seed popular job categories
INSERT INTO public.job_categories (name, sort_order) VALUES
  ('Customer Service', 1),
  ('Maintenance', 2),
  ('Programming', 3),
  ('IT', 4),
  ('Marketing', 5),
  ('Sales', 6),
  ('Engineering', 7),
  ('Healthcare', 8),
  ('Administration', 9),
  ('Finance', 10),
  ('Human Resources', 11),
  ('Retail', 12),
  ('Warehouse', 13),
  ('Delivery', 14),
  ('Education', 15),
  ('Legal', 16),
  ('Design', 17),
  ('Data & Analytics', 18),
  ('Project Management', 19),
  ('Other', 20)
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job_categories"
ON public.job_categories FOR SELECT
USING (true);
