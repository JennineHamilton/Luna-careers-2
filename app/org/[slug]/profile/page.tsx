import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OrganizationProfileClient } from './profile-client';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationSkill = Database['public']['Tables']['organization_skills']['Row'] & {
  skills: Database['public']['Tables']['skills']['Row'];
};
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const organizationId = user.user_metadata?.organization_id;

  if (!organizationId) {
    redirect('/u/dashboard');
  }

  // Fetch organization data by slug and verify user has access
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .eq('id', organizationId)
    .single();

  if (orgError || !organization) {
    console.error('Error fetching organization:', orgError);
    return (
      <div className="p-8">
        <h1 className="text-2xl text-red-600">Error loading organization profile</h1>
        <p className="text-sm text-gray-600 mt-2">{orgError?.message || 'Organization not found or access denied'}</p>
      </div>
    );
  }

  // Fetch organization skills
  const { data: organizationSkills } = await supabase
    .from('organization_skills')
    .select(`
      *,
      skills (*)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  // Fetch organization benefits
  const { data: organizationBenefits } = await supabase
    .from('organization_benefits')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sort_order', { ascending: true });

  return (
    <OrganizationProfileClient
      organization={organization as Organization}
      initialSkills={(organizationSkills as OrganizationSkill[]) || []}
      initialBenefits={(organizationBenefits as OrganizationBenefit[]) || []}
      slug={slug}
    />
  );
}

