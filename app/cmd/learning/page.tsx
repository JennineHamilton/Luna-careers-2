import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { LunaCard, LunaCardContent } from '@/components/luna';
import { LunaButton } from '@/components/luna/button';
import { BookOpen, GraduationCap, Award, Users, Sparkles, Coins, Video, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default async function LearningDashboardPage() {
  // Verify user is authenticated and is a platform admin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    redirect('/u/dashboard');
  }

  // Fetch overview data
  const [
    { count: skillsCount },
    { count: modulesCount },
    { count: coursesCount },
    { count: programsCount },
    { count: enrollmentsCount },
    { count: scholarshipsCount },
  ] = await Promise.all([
    supabase.from('skills').select('*', { count: 'exact', head: true }),
    supabase.from('modules').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('scholarships').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      label: 'Total Programs',
      value: (programsCount || 0).toString(),
      icon: 'GraduationCap' as const,
    },
    {
      label: 'Total Courses',
      value: (coursesCount || 0).toString(),
      icon: 'BookOpen' as const,
    },
    {
      label: 'Total Modules',
      value: (modulesCount || 0).toString(),
      icon: 'Layers' as const,
    },
    {
      label: 'Total Skills',
      value: (skillsCount || 0).toString(),
      icon: 'Sparkles' as const,
    },
    {
      label: 'Active Enrollments',
      value: (enrollmentsCount || 0).toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Active Scholarships',
      value: (scholarshipsCount || 0).toString(),
      icon: 'Award' as const,
    },
  ];

  const quickLinks = [
    {
      title: 'Skills Management',
      description: 'Manage skills across the platform',
      href: '/cmd/learning/skills',
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Creators Management',
      description: 'Manage content creators and instructors',
      href: '/cmd/learning/creators',
      icon: UserCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Lessons Management',
      description: 'Upload and manage SCORM lessons',
      href: '/cmd/learning/lessons',
      icon: Video,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Modules Management',
      description: 'Create and manage learning modules',
      href: '/cmd/learning/modules',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Courses Management',
      description: 'Organize modules into courses',
      href: '/cmd/learning/courses',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Programs Management',
      description: 'Create comprehensive learning programs',
      href: '/cmd/learning/programs',
      icon: Award,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Credits Management',
      description: 'View credit transactions and balances',
      href: '/cmd/learning/credits',
      icon: Coins,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Learning Management System"
        description="Manage all learning content, enrollments, and scholarships"
      />

      <AdminKPIGrid kpis={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <LunaCard className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <LunaCardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${link.bgColor}`}>
                      <Icon className={`w-6 h-6 ${link.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{link.title}</h3>
                      <p className="text-sm text-luna-gray-600">{link.description}</p>
                    </div>
                  </div>
                </LunaCardContent>
              </LunaCard>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

