import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { VerificationsClientTable } from './verifications-client-table';
import type { Database } from '@/types/database.types';

export type VerificationItem = {
  id: string;
  type: 'experience' | 'education' | 'certification';
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  title: string;
  organization: string;
  verification_status: Database['public']['Enums']['verification_status'];
  submitted_at: string;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  // Type-specific fields
  details: any;
};

export default async function VerificationsPage() {
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

  // Fetch all verification items from the three tables
  const [experienceResult, educationResult, certificationResult] = await Promise.all([
    // Professional Experience
    adminClient
      .from('professional_experience')
      .select(`
        id,
        user_id,
        job_title,
        company,
        description,
        location_country,
        start_date,
        end_date,
        currently_working,
        verification_status,
        verified_by,
        verified_at,
        rejection_reason,
        submitted_at
      `)
      .order('submitted_at', { ascending: false }),

    // Education
    adminClient
      .from('education')
      .select(`
        id,
        user_id,
        institution,
        education_level,
        field_of_study,
        start_date,
        end_date,
        currently_enrolled,
        certificate_url,
        verification_status,
        verified_by,
        verified_at,
        rejection_reason,
        submitted_at
      `)
      .order('submitted_at', { ascending: false }),

    // Certifications
    adminClient
      .from('certifications')
      .select(`
        id,
        user_id,
        certification_title,
        issuing_organization,
        issue_date,
        expiry_date,
        does_not_expire,
        certificate_id,
        certificate_url_external,
        certificate_file_url,
        verification_status,
        verified_by,
        verified_at,
        rejection_reason,
        submitted_at
      `)
      .order('submitted_at', { ascending: false }),
  ]);

  // Get unique user IDs
  const userIds = new Set<string>();
  experienceResult.data?.forEach(item => userIds.add(item.user_id));
  educationResult.data?.forEach(item => userIds.add(item.user_id));
  certificationResult.data?.forEach(item => userIds.add(item.user_id));

  // Fetch user details
  const { data: usersData } = await adminClient
    .from('users')
    .select('id, first_name, last_name, email, avatar_url')
    .in('id', Array.from(userIds));

  const usersMap = new Map(
    usersData?.map(u => [
      u.id,
      {
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        email: u.email,
        avatar: u.avatar_url,
      }
    ]) || []
  );

  // Transform data into unified format
  const verificationItems: VerificationItem[] = [
    ...(experienceResult.data || []).map(item => {
      const user = usersMap.get(item.user_id);
      return {
        id: item.id,
        type: 'experience' as const,
        user_id: item.user_id,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        user_avatar: user?.avatar || null,
        title: item.job_title,
        organization: item.company,
        verification_status: item.verification_status || 'pending',
        submitted_at: item.submitted_at || item.start_date,
        verified_by: item.verified_by,
        verified_at: item.verified_at,
        rejection_reason: item.rejection_reason,
        details: item,
      };
    }),
    ...(educationResult.data || []).map(item => {
      const user = usersMap.get(item.user_id);
      return {
        id: item.id,
        type: 'education' as const,
        user_id: item.user_id,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        user_avatar: user?.avatar || null,
        title: item.field_of_study,
        organization: item.institution,
        verification_status: item.verification_status || 'pending',
        submitted_at: item.submitted_at || item.start_date,
        verified_by: item.verified_by,
        verified_at: item.verified_at,
        rejection_reason: item.rejection_reason,
        details: item,
      };
    }),
    ...(certificationResult.data || []).map(item => {
      const user = usersMap.get(item.user_id);
      return {
        id: item.id,
        type: 'certification' as const,
        user_id: item.user_id,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        user_avatar: user?.avatar || null,
        title: item.certification_title,
        organization: item.issuing_organization,
        verification_status: item.verification_status || 'pending',
        submitted_at: item.submitted_at || item.issue_date,
        verified_by: item.verified_by,
        verified_at: item.verified_at,
        rejection_reason: item.rejection_reason,
        details: item,
      };
    }),
  ];

  // Calculate stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const pendingItems = verificationItems.filter(item => item.verification_status === 'pending');
  const verifiedThisMonth = verificationItems.filter(item =>
    item.verification_status === 'verified' &&
    item.verified_at &&
    new Date(item.verified_at) >= firstDayOfMonth
  );
  const rejectedItems = verificationItems.filter(item => item.verification_status === 'rejected');

  const stats = [
    {
      label: 'Pending Verification',
      value: pendingItems.length.toString(),
      icon: 'Clock' as const,
    },
    {
      label: 'Verified This Month',
      value: verifiedThisMonth.length.toString(),
      icon: 'CheckCircle' as const,
    },
    {
      label: 'Total Submissions',
      value: verificationItems.length.toString(),
      icon: 'FileText' as const,
    },
    {
      label: 'Rejected',
      value: rejectedItems.length.toString(),
      icon: 'XCircle' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Credential Verifications"
        description="Review and verify user professional credentials, education, and certifications"
      />

      <AdminKPIGrid kpis={stats} />

      <VerificationsClientTable initialItems={verificationItems} />
    </div>
  );
}

