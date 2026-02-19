import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { JobDetailsClient } from './job-details-client';
import type { Database } from '@/types/database.types';

type Vacancy = Database['public']['Tables']['vacancies']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type JobApplication = Database['public']['Tables']['job_applications']['Row'];
type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

type VacancyWithOrganization = Vacancy & {
  organizations: Organization;
};

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch vacancy with organization details
  const { data: vacancy, error: vacancyError } = await supabase
    .from('vacancies')
    .select(`
      *,
      organizations (*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (vacancyError || !vacancy) {
    notFound();
  }

  // Fetch organization benefits
  const { data: benefits } = await supabase
    .from('organization_benefits')
    .select('*')
    .eq('organization_id', vacancy.organization_id)
    .order('sort_order', { ascending: true });

  // Fetch skill names for required and preferred skills
  const requiredSkillIds = (vacancy.required_skills as string[]) || [];
  const preferredSkillIds = (vacancy.preferred_skills as string[]) || [];
  const allSkillIds = [...requiredSkillIds, ...preferredSkillIds];

  let requiredSkillNames: string[] = [];
  let preferredSkillNames: string[] = [];

  if (allSkillIds.length > 0) {
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name')
      .in('id', allSkillIds);

    if (skillsData) {
      const skillMap = new Map(skillsData.map(skill => [skill.id, skill.name]));
      requiredSkillNames = requiredSkillIds.map(id => skillMap.get(id) || id).filter(Boolean);
      preferredSkillNames = preferredSkillIds.map(id => skillMap.get(id) || id).filter(Boolean);
    }
  }

  // Check if user has already applied
  const { data: existingApplication } = await supabase
    .from('job_applications')
    .select('*')
    .eq('vacancy_id', id)
    .eq('user_id', user.id)
    .single();

  return (
    <JobDetailsClient
      vacancy={vacancy as VacancyWithOrganization}
      existingApplication={existingApplication as JobApplication | null}
      userId={user.id}
      organizationBenefits={benefits as OrganizationBenefit[] || []}
      requiredSkillNames={requiredSkillNames}
      preferredSkillNames={preferredSkillNames}
    />
  );
}

