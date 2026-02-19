import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { OrganizationPublicProfileClient } from './organization-public-profile-client';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrganizationSkill = Database['public']['Tables']['organization_skills']['Row'] & {
  skills: Database['public']['Tables']['skills']['Row'];
};
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

export default async function EmployerPublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch organization by slug only (public, no auth required)
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (orgError || !organization) {
    notFound();
  }

  const organizationId = organization.id;

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

  // Fetch active vacancies for this organization
  const { data: vacancies } = await supabase
    .from('vacancies')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (
    <OrganizationPublicProfileClient
      organization={organization as Organization}
      skills={(organizationSkills as OrganizationSkill[]) || []}
      benefits={(organizationBenefits as OrganizationBenefit[]) || []}
      vacancies={(vacancies as Database['public']['Tables']['vacancies']['Row'][]) || []}
    />
  );
}
