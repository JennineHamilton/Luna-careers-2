import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/badges/user
 * Get current user's submitted skill badges
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's badges with assessment details
    const { data: badges, error } = await supabase
      .from('user_skill_badges')
      .select(`
        *,
        assessment_templates (
          id,
          title,
          description,
          assessment_type,
          language,
          has_audio
        )
      `)
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error fetching user badges:', error);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    return NextResponse.json({ badges: badges || [] });
  } catch (error) {
    console.error('Error in GET /api/screening/badges/user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

