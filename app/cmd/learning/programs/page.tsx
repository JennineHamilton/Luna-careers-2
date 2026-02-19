import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { ProgramsClientTable } from './programs-client-table';
import type { Database } from '@/types/database.types';

type Program = Database['public']['Tables']['programs']['Row'] & {
  creators?: { id: string; name: string; logo_url: string | null } | null;
};

export default async function ProgramsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Verify platform admin
  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    redirect('/u/dashboard');
  }

  // Fetch all programs with creator info
  const { data: programsData, error } = await supabase
    .from('programs')
    .select(`
      *,
      creators (
        id,
        name,
        logo_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
  }

  // Type assertion for programs with creator relationship
  const programs = (programsData || []) as Program[];

  // Calculate KPI stats
  const totalPrograms = programs.length;
  const publishedCount = programs.filter(p => p.is_published).length;
  const freeCount = programs.filter(p => p.is_free).length;
  const scholarshipEligibleCount = programs.filter(p => p.scholarship_eligible).length;
  const avgDuration = programs.length > 0
    ? Math.round(programs.reduce((sum, p) => sum + (p.duration_minutes || 0), 0) / programs.length)
    : 0;

  const stats = [
    {
      label: 'Total Programs',
      value: totalPrograms.toString(),
      icon: 'Award' as const,
    },
    {
      label: 'Published',
      value: publishedCount.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Free Programs',
      value: freeCount.toString(),
      icon: 'Gift' as const,
    },
    {
      label: 'Scholarship Eligible',
      value: scholarshipEligibleCount.toString(),
      icon: 'Trophy' as const,
    },
    {
      label: 'Avg Duration',
      value: `${Math.floor(avgDuration / 60)}h`,
      icon: 'Clock' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-[100px]">
      <AdminPageHeader
        title="Programs Management"
        description="Create comprehensive learning programs"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <ProgramsClientTable initialPrograms={programs} />
    </div>
  );
}

