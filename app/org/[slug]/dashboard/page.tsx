import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const organizationId = user.user_metadata?.organization_id;
  if (!organizationId) redirect('/u/dashboard');

  // Verify org slug matches
  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', slug)
    .eq('id', organizationId)
    .single();

  if (!organization) redirect('/u/dashboard');

  // Fetch stats in parallel
  const [activeVacanciesResult, totalVacanciesResult, vacancyIdsResult, teamResult] = await Promise.all([
    supabase
      .from('vacancies')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_active', true),
    supabase
      .from('vacancies')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('vacancies')
      .select('id')
      .eq('organization_id', organizationId),
    supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
  ]);

  const activeVacancies = activeVacanciesResult.count ?? 0;
  const totalVacancies = totalVacanciesResult.count ?? 0;
  const teamMembers = teamResult.count ?? 0;

  // Get total applications across all org vacancies
  const vacancyIds = vacancyIdsResult.data?.map(v => v.id) || [];
  let totalApplications = 0;
  let pendingApplications = 0;

  if (vacancyIds.length > 0) {
    const [totalAppsResult, pendingAppsResult] = await Promise.all([
      supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .in('vacancy_id', vacancyIds),
      supabase
        .from('job_applications')
        .select('id', { count: 'exact', head: true })
        .in('vacancy_id', vacancyIds)
        .eq('status', 'pending'),
    ]);
    totalApplications = totalAppsResult.count ?? 0;
    pendingApplications = pendingAppsResult.count ?? 0;
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900">{organization.name}</h1>
        <p className="text-sm text-luna-gray-500 mt-1">Organization Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-md p-6 shadow-luna-sm border border-luna-border-default">
          <p className="text-sm text-luna-gray-500 mb-1">Active Vacancies</p>
          <p className="text-2xl font-bold text-luna-gray-900">{activeVacancies}</p>
          <p className="text-xs text-luna-gray-400 mt-1">{totalVacancies} total posted</p>
        </div>
        <div className="bg-white rounded-md p-6 shadow-luna-sm border border-luna-border-default">
          <p className="text-sm text-luna-gray-500 mb-1">Applications</p>
          <p className="text-2xl font-bold text-luna-gray-900">{totalApplications}</p>
          <p className="text-xs text-luna-gray-400 mt-1">{pendingApplications} pending review</p>
        </div>
        <div className="bg-white rounded-md p-6 shadow-luna-sm border border-luna-border-default">
          <p className="text-sm text-luna-gray-500 mb-1">Team Members</p>
          <p className="text-2xl font-bold text-luna-gray-900">{teamMembers}</p>
        </div>
      </div>

      {vacancyIds.length === 0 && (
        <div className="bg-white rounded-md p-8 shadow-luna-sm border border-luna-border-default text-center">
          <p className="text-luna-gray-600 mb-2">No vacancies posted yet.</p>
          <p className="text-sm text-luna-gray-400">
            Go to the Vacancies page to create your first job listing.
          </p>
        </div>
      )}
    </div>
  );
}
