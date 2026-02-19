import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { EmployersClientTable } from './employers-client-table';

export type OrganizationData = {
  id: string;
  name: string;
  logo_url: string | null;
  industry: string | null;
  organization_size: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  created_at: string;
  is_active: boolean;
  account_admin?: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
};

export default async function EmployersPage() {
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

  // Fetch organizations with their admin users
  const { data: orgsData, error } = await adminClient
    .from('organizations')
    .select(`
      id,
      name,
      logo_url,
      industry,
      organization_size,
      contact_email,
      contact_phone,
      street_address,
      city,
      state,
      country,
      created_at,
      is_active
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching organizations:', error);
  }

  // Batch fetch all org_admin users in a single query instead of N+1
  const orgIds = (orgsData || []).map((org: any) => org.id);
  const { data: adminUsers } = orgIds.length > 0
    ? await adminClient
        .from('users')
        .select('id, first_name, last_name, email, avatar_url, organization_id')
        .in('organization_id', orgIds)
        .eq('user_role', 'org_admin')
    : { data: [] };

  // Build lookup map: organization_id -> admin user (first match)
  const adminMap = new Map<string, any>();
  for (const adminUser of adminUsers || []) {
    if (adminUser.organization_id && !adminMap.has(adminUser.organization_id)) {
      adminMap.set(adminUser.organization_id, adminUser);
    }
  }

  const organizations: OrganizationData[] = (orgsData || []).map((org: any) => {
    const adminUser = adminMap.get(org.id) || null;
    return {
      ...org,
      account_admin: adminUser
        ? {
            id: adminUser.id,
            name: `${adminUser.first_name || ''} ${adminUser.last_name || ''}`.trim() || adminUser.email,
            avatar_url: adminUser.avatar_url,
          }
        : null,
    };
  });

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const stats = [
    {
      label: 'Total Organizations',
      value: organizations.length.toString(),
      icon: 'Building2' as const,
    },
    {
      label: 'New This Month',
      value: organizations.filter(o => new Date(o.created_at) >= firstDayOfMonth).length.toString(),
      icon: 'TrendingUp' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organization Management"
        description="Manage all organizations on the platform"
      />

      <AdminKPIGrid kpis={stats} />

      <EmployersClientTable initialOrganizations={organizations} />
    </div>
  );
}

