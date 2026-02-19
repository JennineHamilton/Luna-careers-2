import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const firstName = user.user_metadata?.first_name || '';

  // Fetch all stats in parallel
  const [
    enrollmentsResult, 
    badgesResult, 
    attemptsResult, 
    walletResult, 
    applicationsResult,
  ] = await Promise.all([
    supabase.from('enrollments').select('id, status').eq('user_id', user.id),
    supabase
      .from('user_skill_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('assessment_attempts')
      .select('skill_level_numeric')
      .eq('user_id', user.id)
      .not('skill_level_numeric', 'is', null),
    supabase
      .from('credit_wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ]);

  // Compute stats
  const enrollments = enrollmentsResult.data || [];
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(
    (e) => e.status === 'completed'
  ).length;
  const activeModules = enrollments.filter(
    (e) => e.status === 'active'
  ).length;
  const trainingProgress =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  const achievements = badgesResult.count ?? 0;

  // Performance score: average of skill_level_numeric from typing assessments
  const attempts = attemptsResult.data || [];
  const performanceScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (sum, a) => sum + (a.skill_level_numeric ?? 0),
            0
          ) / attempts.length
        )
      : 0;

  const creditBalance = walletResult.data?.balance ?? 0;
  const applicationCount = applicationsResult.count ?? 0;

  return (
    <DashboardClient
      firstName={firstName}
      stats={{
        trainingProgress,
        totalEnrollments,
        completedEnrollments,
        activeModules,
        achievements,
        performanceScore,
        creditBalance,
        applicationCount,
      }}
    />
  );
}
