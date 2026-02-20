import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { JobsPageClient } from './jobs-client';
import type { Database } from '@/types/database.types';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type JobCategory = Database['public']['Tables']['job_categories']['Row'];

type VacancyWithOrganization = Vacancy & {
  organizations: Organization;
  job_categories: JobCategory | null;
  has_applied?: boolean;
};

export default async function JobsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch job categories for filter pills
  const { data: jobCategories } = await supabase
    .from('job_categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  // Fetch all active vacancies with organization and category
  const { data: vacancies, error: vacanciesError } = await supabase
    .from('vacancies')
    .select(`
      *,
      organizations (*),
      job_categories (id, name)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (vacanciesError) {
    console.error('Error fetching vacancies:', vacanciesError);
  }

  // Check which vacancies the user has already applied to
  const vacanciesWithApplicationStatus: VacancyWithOrganization[] = [];

  if (vacancies) {
    for (const vacancy of vacancies) {
      const { data: application } = await supabase
        .from('job_applications')
        .select('id')
        .eq('vacancy_id', vacancy.id)
        .eq('user_id', user.id)
        .single();

      vacanciesWithApplicationStatus.push({
        ...vacancy,
        has_applied: !!application,
      } as VacancyWithOrganization);
    }
  }

  return (
    <JobsPageClient
      vacancies={vacanciesWithApplicationStatus}
      jobCategories={jobCategories ?? []}
      userId={user.id}
    />
  );
}

