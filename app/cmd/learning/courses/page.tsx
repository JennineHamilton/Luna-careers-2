import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { CoursesClientTable } from './courses-client-table';
import type { Database } from '@/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];

export default async function CoursesPage() {
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

  // Fetch all courses with creator info
  const { data: coursesData, error } = await supabase
    .from('courses')
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
    console.error('Error fetching courses:', error);
  }

  const courses: Course[] = coursesData || [];

  // Calculate KPI stats
  const totalCourses = courses.length;
  const publishedCount = courses.filter(c => c.is_published).length;
  const freeCount = courses.filter(c => c.is_free).length;
  const scholarshipEligibleCount = courses.filter(c => c.scholarship_eligible).length;
  const avgDuration = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / courses.length)
    : 0;

  const stats = [
    {
      label: 'Total Courses',
      value: totalCourses.toString(),
      icon: 'GraduationCap' as const,
    },
    {
      label: 'Published',
      value: publishedCount.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Free Courses',
      value: freeCount.toString(),
      icon: 'Gift' as const,
    },
    {
      label: 'Scholarship Eligible',
      value: scholarshipEligibleCount.toString(),
      icon: 'Award' as const,
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
        title="Courses Management"
        description="Organize modules into comprehensive courses"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <CoursesClientTable initialCourses={courses} />
    </div>
  );
}

