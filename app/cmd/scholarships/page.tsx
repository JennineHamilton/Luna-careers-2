import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { ScholarshipsTabs } from './scholarships-tabs';
import type { Database } from '@/types/database.types';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];
type ScholarshipApplicationRow = Database['public']['Tables']['scholarship_applications']['Row'];

interface ScholarshipApplication extends ScholarshipApplicationRow {
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  scholarships: {
    id: string;
    name: string;
    type: string;
    discount_percentage: number;
  } | null;
}

export default async function ScholarshipsPage() {
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

  // Fetch all scholarships
  const { data: scholarshipsData, error } = await supabase
    .from('scholarships')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scholarships:', error);
  }

  const scholarships: Scholarship[] = scholarshipsData || [];

  // Fetch all scholarship applications with scholarship details
  const { data: applicationsData, error: appsError } = await supabase
    .from('scholarship_applications')
    .select(`
      *,
      scholarships (
        id,
        name,
        type,
        discount_percentage
      )
    `)
    .order('applied_at', { ascending: false });

  if (appsError) {
    console.error('Error fetching scholarship applications:', appsError);
  }

  // Fetch user details separately since user_id references auth.users, not public.users
  // Use admin client to bypass RLS
  const adminClient = createAdminClient();
  const rawApplications = applicationsData || [];
  const userIds = [...new Set(rawApplications.map(app => app.user_id))];

  const { data: usersData } = await adminClient
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

  // Combine applications with user data
  const applications: ScholarshipApplication[] = rawApplications.map(app => ({
    ...app,
    users: usersMap.get(app.user_id) || null,
  }));

  // Fetch content details for each application
  const contentDetails: Record<string, { title: string; image: string | null; type: string }> = {};

  for (const app of applications) {
    const contentId = app.content_id;
    const contentType = app.content_type;

    if (!contentDetails[contentId]) {
      let contentData = null;

      if (contentType === 'module') {
        const { data } = await supabase
          .from('modules')
          .select('title, cover_image_url')
          .eq('id', contentId)
          .single();
        contentData = data;
      } else if (contentType === 'course') {
        const { data } = await supabase
          .from('courses')
          .select('title, cover_image_url')
          .eq('id', contentId)
          .single();
        contentData = data;
      } else if (contentType === 'program') {
        const { data } = await supabase
          .from('programs')
          .select('title, cover_image_url')
          .eq('id', contentId)
          .single();
        contentData = data;
      }

      if (contentData) {
        contentDetails[contentId] = {
          title: contentData.title,
          image: contentData.cover_image_url,
          type: contentType,
        };
      }
    }
  }

  // Calculate counts
  const applicationsCount = applications.length;
  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  // Calculate KPI stats
  const totalScholarships = scholarships.length;
  const activeCount = scholarships.filter(s => s.is_active).length;
  const fullScholarships = scholarships.filter(s => s.type === 'full').length;
  const partialScholarships = scholarships.filter(s => s.type === 'partial').length;

  const stats = [
    {
      label: 'Total Scholarships',
      value: totalScholarships.toString(),
      icon: 'Award' as const,
    },
    {
      label: 'Active',
      value: activeCount.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Applications',
      value: (applicationsCount || 0).toString(),
      icon: 'FileText' as const,
    },
    {
      label: 'Pending Review',
      value: (pendingCount || 0).toString(),
      icon: 'Clock' as const,
    },
    {
      label: 'Approved',
      value: (approvedCount || 0).toString(),
      icon: 'ThumbsUp' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      <AdminPageHeader
        title="Scholarships Management"
        description="Manage scholarship programs and applications"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <ScholarshipsTabs
        initialScholarships={scholarships}
        initialApplications={applications}
        contentDetails={contentDetails}
        currentUserId={user.id}
      />
    </div>
  );
}

