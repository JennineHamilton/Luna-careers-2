import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ApplicantsPageClient } from './applicants-client';
import type { Database } from '@/types/database.types';

type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type User = Database['public']['Tables']['users']['Row'];

type ApplicationWithDetails = JobApplication & {
  vacancies: Vacancy;
  users: User;
};

export default async function ApplicantsPage({
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

  // Get organization ID from user metadata
  const organizationId = user.user_metadata?.organization_id;

  if (!organizationId) {
    redirect('/u/profile');
  }

  // Verify organization exists and slug matches
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, slug')
    .eq('id', organizationId)
    .single();

  if (!organization || organization.slug !== slug) {
    redirect('/u/profile');
  }

  // First, get all vacancies for this organization
  const { data: orgVacancies, error: vacanciesError } = await supabase
    .from('vacancies')
    .select('id')
    .eq('organization_id', organizationId);

  if (vacanciesError) {
    console.error('Error fetching vacancies:', vacanciesError);
  }

  const vacancyIds = orgVacancies?.map(v => v.id) || [];

  // Fetch all applications for this organization's vacancies
  let applications: ApplicationWithDetails[] = [];

  if (vacancyIds.length > 0) {
    // First, get applications with vacancy details
    const { data: applicationsData, error: applicationsError } = await supabase
      .from('job_applications')
      .select(`
        *,
        vacancies (*)
      `)
      .in('vacancy_id', vacancyIds)
      .order('applied_at', { ascending: false });

    if (applicationsError) {
      console.error('Error fetching applications:', applicationsError);
      applications = [];
    } else if (applicationsData) {
      // Fetch user details separately from public.users table
      const userIds = applicationsData.map(app => app.user_id);
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

      // Combine applications with user data
      applications = applicationsData.map(app => ({
        ...app,
        users: usersData?.find(u => u.id === app.user_id) || {} as User,
      })) as unknown as ApplicationWithDetails[];
    }
  }

  return (
    <ApplicantsPageClient
      applications={applications}
      organizationId={organizationId}
      slug={slug}
    />
  );
}

