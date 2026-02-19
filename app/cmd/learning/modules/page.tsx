import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { ModulesClientTable } from './modules-client-table';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];

export default async function ModulesPage() {
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

  // Fetch modules data with creator relationship
  const { data: modulesData, error } = await supabase
    .from('modules')
    .select('*, creators(id, name, logo_url)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching modules:', error);
  }

  const modules: Module[] = modulesData || [];

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = [
    {
      label: 'Total Modules',
      value: modules.length.toString(),
      icon: 'BookOpen' as const,
    },
    {
      label: 'Published',
      value: modules.filter(m => m.is_published).length.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Free Modules',
      value: modules.filter(m => m.is_free).length.toString(),
      icon: 'Gift' as const,
    },
    {
      label: 'Added This Month',
      value: modules.filter(m => m.created_at && new Date(m.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        title="Modules Management"
        description="Manage learning modules across the platform"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <ModulesClientTable initialModules={modules} />
    </div>
  );
}

