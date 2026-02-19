import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ApplicationsPageClient } from './applications-client';
import type { Database } from '@/types/database.types';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];

// Type for preserved vacancy information in application_data
type DeletedVacancyInfo = {
  vacancy_title: string;
  vacancy_description: string;
  organization_id: string;
  organization_name: string;
  organization_logo_url: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  is_remote: boolean;
  work_location: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  deleted_at: string;
};

type ApplicationData = {
  deleted_vacancy_info?: DeletedVacancyInfo;
  [key: string]: any;
};

type ApplicationWithDetails = JobApplication & {
  vacancies: (Vacancy & {
    organizations: Organization;
  }) | null;
  application_data: ApplicationData | null;
};

export default async function ApplicationsPage() {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user's job applications with vacancy and organization details
  const { data: applicationsData, error: appsError } = await supabase
    .from('job_applications')
    .select(`
      *,
      vacancies (
        *,
        organizations (*)
      )
    `)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false });

  if (appsError) {
    console.error('Error fetching job applications:', appsError);
  }

  const applications: ApplicationWithDetails[] = (applicationsData as unknown as ApplicationWithDetails[]) || [];

  return (
    <ApplicationsPageClient
      applications={applications}
      userId={user.id}
    />
  );
}

