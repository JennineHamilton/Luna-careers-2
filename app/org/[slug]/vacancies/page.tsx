import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VacanciesPageClient } from './vacancies-client';
import type { Database } from '@/types/database.types';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type VacancyWithApplicationCount = Vacancy & {
  application_count: number;
};

export default async function VacanciesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const organizationId = user.user_metadata?.organization_id;

  if (!organizationId) {
    redirect('/u/dashboard');
  }

  // Verify user has access to this organization
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .eq('id', organizationId)
    .single();

  if (!organization) {
    redirect('/u/dashboard');
  }

  // Fetch all vacancies for this organization
  const { data: vacancies, error: vacanciesError } = await supabase
    .from('vacancies')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (vacanciesError) {
    console.error('Error fetching vacancies:', vacanciesError);
  }

  // Fetch application counts for each vacancy
  const vacanciesWithCounts: VacancyWithApplicationCount[] = [];

  if (vacancies) {
    for (const vacancy of vacancies) {
      const { count } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('vacancy_id', vacancy.id);

      vacanciesWithCounts.push({
        ...vacancy,
        application_count: count || 0,
      });
    }
  }

  return (
    <VacanciesPageClient
      vacancies={vacanciesWithCounts}
      organizationId={organizationId}
      slug={slug}
    />
  );
}

