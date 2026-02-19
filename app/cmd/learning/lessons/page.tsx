import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { LessonsTabs } from './lessons-tabs';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'] & {
  question_count?: number;
};

export default async function LessonsPage() {
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

  // Fetch all lessons with creator info
  const { data: lessonsData, error } = await supabase
    .from('lessons')
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
    console.error('Error fetching lessons:', error);
  }

  const lessons: Lesson[] = lessonsData || [];

  // Fetch all quizzes with question count
  const { data: quizzesData, error: quizzesError } = await supabase
    .from('quizzes')
    .select(`
      *,
      quiz_questions (
        id
      )
    `)
    .order('created_at', { ascending: false });

  if (quizzesError) {
    console.error('Error fetching quizzes:', quizzesError);
  }

  // Transform quizzes to include question count
  const quizzes: Quiz[] = quizzesData?.map(quiz => ({
    ...quiz,
    question_count: quiz.quiz_questions?.length || 0,
    quiz_questions: undefined,
  })) || [];

  // Calculate KPI stats
  const totalLessons = lessons.length;
  const scorm12Count = lessons.filter(l => l.scorm_version === '1.2').length;
  const scorm2004Count = lessons.filter(l => l.scorm_version === '2004').length;
  const avgDuration = lessons.length > 0
    ? Math.round(lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) / lessons.length)
    : 0;

  const stats = [
    {
      label: 'Total Lessons',
      value: totalLessons.toString(),
      icon: 'Video' as const,
    },
    {
      label: 'SCORM 1.2',
      value: scorm12Count.toString(),
      icon: 'FileArchive' as const,
    },
    {
      label: 'SCORM 2004',
      value: scorm2004Count.toString(),
      icon: 'Package' as const,
    },
    {
      label: 'Avg Duration',
      value: `${avgDuration} min`,
      icon: 'Clock' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-[100px]">
      <AdminPageHeader
        title="Lessons & Quizzes Management"
        description="Upload and manage SCORM lessons and create quizzes for the learning platform"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <LessonsTabs initialLessons={lessons} initialQuizzes={quizzes} />
    </div>
  );
}

