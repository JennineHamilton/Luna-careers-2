import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { CreatorsClientTable } from './creators-client-table';
import type { Database } from '@/types/database.types';

type Creator = Database['public']['Tables']['creators']['Row'];

export default async function CreatorsPage() {
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

  // Fetch creators data
  const { data: creatorsData, error } = await supabase
    .from('creators')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching creators:', error);
  }

  const creators: Creator[] = creatorsData || [];

  // Calculate stats
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const verifiedCount = creators.filter(c => c.verified).length;
  const types = new Set(creators.map(c => c.type));
  
  const stats = [
    {
      label: 'Total Creators',
      value: creators.length.toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Verified',
      value: verifiedCount.toString(),
      icon: 'BadgeCheck' as const,
    },
    {
      label: 'Creator Types',
      value: types.size.toString(),
      icon: 'FolderTree' as const,
    },
    {
      label: 'Added This Month',
      value: creators.filter(c => c.created_at && new Date(c.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Creators Management"
        description="Manage content creators across the learning platform"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <CreatorsClientTable initialCreators={creators} />
    </div>
  );
}

