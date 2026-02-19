-- Migration: Preserve vacancy details when vacancy is deleted
-- Description: Store vacancy and organization details in application_data before deletion

-- Create a function to preserve vacancy details before deletion
CREATE OR REPLACE FUNCTION preserve_vacancy_details_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all applications for this vacancy to store the vacancy details
  UPDATE public.job_applications
  SET application_data = jsonb_set(
    COALESCE(application_data, '{}'::jsonb),
    '{deleted_vacancy_info}',
    jsonb_build_object(
      'vacancy_title', OLD.title,
      'vacancy_description', OLD.description,
      'organization_id', OLD.organization_id,
      'organization_name', (SELECT name FROM public.organizations WHERE id = OLD.organization_id),
      'organization_logo_url', (SELECT logo_url FROM public.organizations WHERE id = OLD.organization_id),
      'location_city', OLD.location_city,
      'location_state', OLD.location_state,
      'location_country', OLD.location_country,
      'is_remote', OLD.is_remote,
      'work_location', OLD.work_location,
      'employment_type', OLD.employment_type,
      'salary_min', OLD.salary_range_min,
      'salary_max', OLD.salary_range_max,
      'salary_currency', OLD.salary_currency,
      'deleted_at', NOW()
    )
  )
  WHERE vacancy_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run before vacancy deletion
DROP TRIGGER IF EXISTS preserve_vacancy_details_trigger ON public.vacancies;
CREATE TRIGGER preserve_vacancy_details_trigger
BEFORE DELETE ON public.vacancies
FOR EACH ROW
EXECUTE FUNCTION preserve_vacancy_details_before_delete();

-- Add comment
COMMENT ON FUNCTION preserve_vacancy_details_before_delete() IS 
'Preserves vacancy and organization details in application_data before vacancy is deleted, ensuring users can still see what they applied for.';

