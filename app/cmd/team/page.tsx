import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { TeamClientTable } from './team-client-table';

export type TeamMemberData = {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  onboarding_completed: boolean;
  is_suspended: boolean;
  suspension_reason: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  location: string | null;
};

export default async function TeamPage() {
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
  const { data: adminsData, error } = await adminClient
    .from('users')
    .select('id, first_name, last_name, email, user_role, created_at, onboarding_completed, is_suspended, suspension_reason, avatar_url, phone, bio, location')
    .eq('account_type', 'platformAdmin')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching team members:', error);
  }

  // Transform data
  const teamMembers: TeamMemberData[] = (adminsData || []).map((admin: any) => ({
    id: admin.id,
    name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'No Name',
    first_name: admin.first_name || '',
    last_name: admin.last_name || '',
    email: admin.email,
    role: admin.user_role,
    created_at: admin.created_at,
    onboarding_completed: admin.onboarding_completed || false,
    is_suspended: admin.is_suspended || false,
    suspension_reason: admin.suspension_reason || null,
    avatar_url: admin.avatar_url || null,
    phone: admin.phone || null,
    bio: admin.bio || null,
    location: admin.location || null,
  }));

  // Calculate stats
  const stats = [
    {
      label: 'Total Team Members',
      value: teamMembers.length.toString(),
      icon: 'Users' as const,
    },
    {
      label: 'Active',
      value: teamMembers.filter(m => m.onboarding_completed).length.toString(),
      icon: 'UserCheck' as const,
    },
    {
      label: 'Pending',
      value: teamMembers.filter(m => !m.onboarding_completed).length.toString(),
      icon: 'Clock' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Team"
        description="Manage platform administrators and team members"
      />

      <AdminKPIGrid kpis={stats} />

      <TeamClientTable initialTeamMembers={teamMembers} />
    </div>
  );
}

