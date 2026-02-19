import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { attempt_id } = body;

    if (!attempt_id) {
      return NextResponse.json({ error: 'Missing attempt_id' }, { status: 400 });
    }

    // Verify attempt belongs to user and is completed
    const { data: attempt, error: attemptError } = await supabase
      .from('knowledge_attempts')
      .select('*, assessment:knowledge_assessments(*)')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found or not completed' }, { status: 404 });
    }

    // First, set all previous attempts for this assessment to display_on_profile = false
    const { error: clearError } = await supabase
      .from('knowledge_attempts')
      .update({ display_on_profile: false })
      .eq('user_id', user.id)
      .eq('assessment_id', attempt.assessment_id)
      .eq('display_on_profile', true);

    if (clearError) {
      console.error('Error clearing previous attempts:', clearError);
      // Continue anyway - this is not critical
    }

    // Now mark this attempt to display on profile
    const { error: updateError } = await supabase
      .from('knowledge_attempts')
      .update({ display_on_profile: true })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json({ error: 'Failed to add to profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      display_on_profile: true,
      message: 'Successfully added to profile'
    });
  } catch (error) {
    console.error('Error in POST /api/screening/knowledge/attempts/submit-to-profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

