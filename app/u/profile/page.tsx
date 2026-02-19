import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch all profile data in parallel for performance
  const [
    { data: profile },
    { data: experiences },
    { data: education },
    { data: certifications },
    { data: languages },
    { data: userSkills },
    { data: verifiedSkills },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('professional_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('education').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('certifications').select('*').eq('user_id', user.id).order('issue_date', { ascending: false }),
    supabase.from('user_languages').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_skills').select('id, skill_id, created_at, skills (id, name, category)').eq('user_id', user.id),
    supabase.from('user_verified_skills').select('id, skill_id, source_type, source_id, verified_at, skills (id, name, category)').eq('user_id', user.id),
  ]);

  return (
    <ProfileClient
      profile={profile}
      experiences={experiences || []}
      education={education || []}
      certifications={certifications || []}
      languages={languages || []}
      userSkills={userSkills || []}
      verifiedSkills={verifiedSkills || []}
    />
  );
}

