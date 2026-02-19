import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicProfileClient } from './public-profile-client';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['users']['Row'];
type ProfessionalExperience = Database['public']['Tables']['professional_experience']['Row'];
type Education = Database['public']['Tables']['education']['Row'];
type Certification = Database['public']['Tables']['certifications']['Row'];
type UserLanguage = Database['public']['Tables']['user_languages']['Row'];

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  // Fetch user profile (publicly accessible)
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch professional experience (only verified ones)
  const { data: experiences } = await supabase
    .from('professional_experience')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_status', 'verified')
    .order('start_date', { ascending: false });

  // Fetch education (only verified ones)
  const { data: education } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_status', 'verified')
    .order('start_date', { ascending: false });

  // Fetch certifications (only verified ones)
  const { data: certifications } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId)
    .eq('verification_status', 'verified')
    .order('issue_date', { ascending: false });

  // Fetch languages
  const { data: languages } = await supabase
    .from('user_languages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  // Fetch skills (both user-selected and verified)
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select(`
      id,
      skill_id,
      created_at,
      skills (
        id,
        name,
        category
      )
    `)
    .eq('user_id', userId);

  const { data: verifiedSkills } = await supabase
    .from('user_verified_skills')
    .select(`
      id,
      skill_id,
      source_type,
      source_id,
      verified_at,
      skills (
        id,
        name,
        category
      )
    `)
    .eq('user_id', userId);

  return (
    <PublicProfileClient
      profile={profile as Profile}
      experiences={experiences || []}
      education={education || []}
      certifications={certifications || []}
      languages={languages || []}
      userSkills={userSkills || []}
      verifiedSkills={verifiedSkills || []}
    />
  );
}

