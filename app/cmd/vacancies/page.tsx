import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { VacanciesClientTable } from './vacancies-client-table';

export type VacancyData = {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  location_country: string | null;
  location_state: string | null;
  location_city: string | null;
  is_remote: boolean;
  work_location: string | null;
  employment_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  required_skills: any;
  preferred_skills: any;
  benefits: any;
  application_deadline: string | null;
  prerequisite_assessments?: any;
  prerequisite_learning_content?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  organization: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  applications_count: number;
};

export default async function VacanciesPage() {
  // First, verify user is authenticated and is a platform admin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    redirect('/u/dashboard');
  }

  // Now use admin client to fetch data (bypasses RLS)
  const adminClient = createAdminClient();

  // Fetch vacancies with organization details
  const { data: vacanciesData, error } = await adminClient
    .from('vacancies')
    .select(`
      id,
      organization_id,
      title,
      description,
      requirements,
      responsibilities,
      location_country,
      location_state,
      location_city,
      is_remote,
      work_location,
      employment_type,
      experience_level,
      salary_range_min,
      salary_range_max,
      salary_currency,
      required_skills,
      preferred_skills,
      benefits,
      application_deadline,
      prerequisite_assessments,
      prerequisite_learning_content,
      is_active,
      created_at,
      updated_at,
      created_by,
      organizations!inner(id, name, logo_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vacancies:', error);
  }

  // Batch fetch all application counts in a single query instead of N+1
  const vacancyIds = (vacanciesData || []).map((v: any) => v.id);
  let appCountMap = new Map<string, number>();

  if (vacancyIds.length > 0) {
    const { data: applications } = await adminClient
      .from('job_applications')
      .select('vacancy_id')
      .in('vacancy_id', vacancyIds);

    // Count applications per vacancy
    for (const app of applications || []) {
      if (app.vacancy_id) {
        appCountMap.set(app.vacancy_id, (appCountMap.get(app.vacancy_id) || 0) + 1);
      }
    }
  }

  const vacancies: VacancyData[] = (vacanciesData || []).map((vacancy: any) => ({
    ...vacancy,
    organization: vacancy.organizations,
    applications_count: appCountMap.get(vacancy.id) || 0,
  }));

  // Fetch organizations for admin create-vacancy modal (org selector)
  const { data: orgsData } = await adminClient
    .from('organizations')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  const organizations = (orgsData || []).map((o: { id: string; name: string }) => ({ id: o.id, name: o.name }));

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = [
    {
      label: 'Total Vacancies',
      value: vacancies.length.toString(),
      icon: 'Briefcase' as const,
    },
    {
      label: 'Active Vacancies',
      value: vacancies.filter(v => v.is_active).length.toString(),
      icon: 'CheckCircle2' as const,
    },
    {
      label: 'Suspended',
      value: vacancies.filter(v => !v.is_active).length.toString(),
      icon: 'Ban' as const,
    },
    {
      label: 'New This Month',
      value: vacancies.filter(v => new Date(v.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vacancy Management"
        description="Manage all job vacancies across the platform"
      />

      <AdminKPIGrid kpis={stats} />

      <VacanciesClientTable initialVacancies={vacancies} organizations={organizations} />
    </div>
  );
}
