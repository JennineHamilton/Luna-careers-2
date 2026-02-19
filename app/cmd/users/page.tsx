import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { UsersClientTable } from './users-client-table';

export type UserData = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: string;
  user_role: string;
  created_at: string;
  onboarding_completed: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
};

export default async function UsersPage() {
  // First, verify user is authenticated and is a platform admin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    redirect('/u/dashboard');
  }

  // Now use admin client to fetch data (bypasses RLS)
  const adminClient = createAdminClient();

  const { data: usersData, error } = await adminClient
    .from('users')
    .select('id, first_name, last_name, email, account_type, user_role, created_at, onboarding_completed, is_suspended, suspension_reason, avatar_url, phone, bio, location')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  // Transform data
  const users: UserData[] = (usersData || []).map((user: any) => ({
    id: user.id,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email,
    account_type: user.account_type,
    user_role: user.user_role,
    created_at: user.created_at,
    onboarding_completed: user.onboarding_completed || false,
    is_suspended: user.is_suspended || false,
    suspension_reason: user.suspension_reason || null,
    avatar_url: user.avatar_url || null,
    phone: user.phone || null,
    bio: user.bio || null,
    location: user.location || null,
  }));

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = [
    {
      label: 'Total Users',
      value: users.length.toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Active Users',
      value: users.filter(u => u.onboarding_completed).length.toString(),
      icon: 'UserCheck' as const,
    },
    {
      label: 'New This Month',
      value: users.filter(u => new Date(u.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
    {
      label: 'Pending',
      value: users.filter(u => !u.onboarding_completed).length.toString(),
      icon: 'Clock' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Manage all users across the platform"
      />

      <AdminKPIGrid kpis={stats} />

      <UsersClientTable initialUsers={users} />
    </div>
  );
}

