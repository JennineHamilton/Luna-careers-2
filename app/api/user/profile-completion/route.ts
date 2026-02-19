import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all profile completion data in parallel
    const [
      profileResult,
      experienceResult,
      educationResult,
      certificationResult,
      skillsResult,
      languagesResult,
    ] = await Promise.all([
      supabase
        .from('users')
        .select('avatar_url, intro_video_url, bio')
        .eq('id', user.id)
        .single(),
      supabase
        .from('professional_experience')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('education')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('certifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('user_skills')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('user_languages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    const profile = profileResult.data;

    return NextResponse.json({
      avatar_url: profile?.avatar_url || null,
      intro_video_url: profile?.intro_video_url || null,
      bio: profile?.bio || null,
      experienceCount: experienceResult.count || 0,
      educationCount: educationResult.count || 0,
      certificationCount: certificationResult.count || 0,
      skillsCount: skillsResult.count || 0,
      languagesCount: languagesResult.count || 0,
    });
  } catch (error) {
    console.error('Error fetching profile completion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
