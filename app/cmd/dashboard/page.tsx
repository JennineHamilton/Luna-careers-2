import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) redirect('/login');

  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') redirect('/u/dashboard');

  const adminClient = createAdminClient();

  // Fetch all platform stats in parallel
  const [
    usersResult,
    orgsResult,
    vacanciesResult,
    applicationsResult,
    enrollmentsResult,
    walletsResult,
  ] = await Promise.all([
    adminClient.from('users').select('id', { count: 'exact', head: true }),
    adminClient.from('organizations').select('id', { count: 'exact', head: true }),
    adminClient.from('vacancies').select('id, is_active'),
    adminClient.from('job_applications').select('id', { count: 'exact', head: true }),
    adminClient.from('enrollments').select('id, status'),
    adminClient.from('credit_wallets').select('balance'),
  ]);

  const totalUsers = usersResult.count ?? 0;
  const totalOrgs = orgsResult.count ?? 0;

  const vacancies = vacanciesResult.data || [];
  const activeVacancies = vacancies.filter(v => v.is_active).length;

  const totalApplications = applicationsResult.count ?? 0;

  const enrollments = enrollmentsResult.data || [];
  const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

  const wallets = walletsResult.data || [];
  const totalCreditsCirculating = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);

  const stats = [
    { label: 'Total Users', value: totalUsers.toString(), icon: 'Users' },
    { label: 'Organizations', value: totalOrgs.toString(), icon: 'Building2' },
    { label: 'Active Vacancies', value: activeVacancies.toString(), icon: 'Briefcase' },
    { label: 'Job Applications', value: totalApplications.toString(), icon: 'FileText' },
    { label: 'Active Enrollments', value: activeEnrollments.toString(), icon: 'BookOpen' },
    { label: 'Completed Courses', value: completedEnrollments.toString(), icon: 'GraduationCap' },
    { label: 'Credits in Circulation', value: totalCreditsCirculating.toLocaleString(), icon: 'Coins' },
    { label: 'Total Vacancies', value: vacancies.length.toString(), icon: 'ClipboardList' },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Dashboard"
        description="Overview of platform activity and key metrics"
      />

      <AdminKPIGrid kpis={stats} />
    </div>
  );
}
