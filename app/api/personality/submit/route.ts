/**
 * POST /api/personality/submit
 * Submit the assessment to make it visible to employers
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { attempt_id } = body;

    if (!attempt_id) {
      return NextResponse.json(
        { error: 'Missing attempt_id' },
        { status: 400 }
      );
    }

    // Verify attempt belongs to user and is completed
    const { data: attempt, error: attemptError } = await supabase
      .from('personality_attempts')
      .select('id, user_id, status')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (attempt.status !== 'completed') {
      return NextResponse.json(
        { error: 'Assessment must be completed before submission' },
        { status: 400 }
      );
    }

    // Update status to submitted
    const { error: updateError } = await supabase
      .from('personality_attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error submitting assessment:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Assessment submitted successfully'
    });

  } catch (error) {
    console.error('Error in /api/personality/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

