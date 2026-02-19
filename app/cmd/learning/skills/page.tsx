import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { SkillsClientTable } from './skills-client-table';
import type { Database } from '@/types/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];

export default async function SkillsPage() {
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

  // Fetch skills data
  const { data: skillsData, error } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching skills:', error);
  }

  const skills: Skill[] = skillsData || [];

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Get unique categories
  const categories = new Set(skills.map(s => s.category));
  
  const stats = [
    {
      label: 'Total Skills',
      value: skills.length.toString(),
      icon: 'Sparkles' as const,
    },
    {
      label: 'Categories',
      value: categories.size.toString(),
      icon: 'FolderTree' as const,
    },
    {
      label: 'Added This Month',
      value: skills.filter(s => s.created_at && new Date(s.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
    {
      label: 'Recently Updated',
      value: skills.filter(s => s.updated_at && new Date(s.updated_at) >= firstDayOfMonth).length.toString(),
      icon: 'RefreshCw' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Skills Management"
        description="Manage skills across the learning platform"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <SkillsClientTable initialSkills={skills} />
    </div>
  );
}

