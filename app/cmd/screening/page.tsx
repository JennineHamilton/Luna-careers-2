import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { ScreeningClientTable } from './screening-client-table';
import type { Database } from '@/types/database.types';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];

export default async function ScreeningPage() {
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

  // Fetch all assessment templates (typing assessments)
  const { data: assessmentsData, error } = await supabase
    .from('assessment_templates')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching assessments:', error);
  }

  const assessments: AssessmentTemplate[] = assessmentsData || [];

  // Fetch knowledge assessments
  const { data: knowledgeAssessmentsData, error: knowledgeError } = await supabase
    .from('knowledge_assessments')
    .select('*')
    .order('created_at', { ascending: false });

  if (knowledgeError) {
    console.error('Error fetching knowledge assessments:', knowledgeError);
  }

  const knowledgeAssessments = knowledgeAssessmentsData || [];

  // Fetch total attempts count
  const { count: totalAttempts } = await supabase
    .from('assessment_attempts')
    .select('*', { count: 'exact', head: true });

  // Fetch submitted attempts for average WPM
  const { data: submittedAttempts } = await supabase
    .from('assessment_attempts')
    .select('wpm')
    .eq('is_submitted', true);

  // Calculate KPI stats
  const totalAssessments = assessments.length + knowledgeAssessments.length;
  const activeCount = assessments.filter(a => a.is_active).length;
  const typingCount = assessments.filter(a => a.assessment_type === 'typing').length;
  const knowledgeCount = knowledgeAssessments.length;
  const transcriptionCount = assessments.filter(a => a.has_audio).length;
  const avgWPM = submittedAttempts && submittedAttempts.length > 0
    ? Math.round(submittedAttempts.reduce((sum, a) => sum + (a.wpm || 0), 0) / submittedAttempts.length)
    : 0;

  const stats = [
    {
      label: 'Total Assessments',
      value: totalAssessments.toString(),
      icon: 'FileText' as const,
    },
    {
      label: 'Active',
      value: activeCount.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Total Attempts',
      value: (totalAttempts || 0).toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Typing Tests',
      value: typingCount.toString(),
      icon: 'Keyboard' as const,
    },
    {
      label: 'Knowledge Tests',
      value: knowledgeCount.toString(),
      icon: 'BookOpen' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pre-Screening Assessments"
        description="Manage typing tests, transcription tests, and other skill assessments"
      />

      <AdminKPIGrid kpis={stats} />

      <ScreeningClientTable initialData={assessments} knowledgeAssessments={knowledgeAssessments} />
    </div>
  );
}

