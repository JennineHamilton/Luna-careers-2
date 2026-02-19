import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { KnowledgeAssessmentsTable } from './knowledge-assessments-table';
import type { Database } from '@/types/database.types';

type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];

export default async function KnowledgeAssessmentsPage() {
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

  // Fetch all knowledge assessments
  const { data: assessmentsData, error } = await supabase
    .from('knowledge_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching knowledge assessments:', error);
  }

  const assessments: KnowledgeAssessment[] = assessmentsData || [];

  // Fetch total attempts count
  const { count: totalAttempts } = await supabase
    .from('knowledge_attempts')
    .select('*', { count: 'exact', head: true });

  // Fetch completed attempts for pass rate
  const { data: completedAttempts } = await supabase
    .from('knowledge_attempts')
    .select('passed')
    .eq('status', 'completed');

  // Calculate KPI stats
  const totalAssessments = assessments.length;
  const publishedCount = assessments.filter(a => a.is_published).length;
  const passedCount = completedAttempts?.filter(a => a.passed).length || 0;
  const passRate = completedAttempts && completedAttempts.length > 0
    ? Math.round((passedCount / completedAttempts.length) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Assessments',
      value: totalAssessments.toString(),
      icon: 'FileText' as const,
    },
    {
      label: 'Published',
      value: publishedCount.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Total Attempts',
      value: (totalAttempts || 0).toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Pass Rate',
      value: passRate > 0 ? `${passRate}%` : 'N/A',
      icon: 'TrendingUp' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Knowledge & Skill Assessments"
        description="Manage knowledge tests for cybersecurity, Excel, internet basics, and more"
      />

      <AdminKPIGrid kpis={stats} />

      <KnowledgeAssessmentsTable initialData={assessments} />
    </div>
  );
}

