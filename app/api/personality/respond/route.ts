/**
 * POST /api/personality/respond
 * Save a response to a personality question
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
    const { attempt_id, question_id, response_value, response_time_ms } = body;

    // Validate input
    if (!attempt_id || !question_id || !response_value) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (response_value < 1 || response_value > 5) {
      return NextResponse.json(
        { error: 'Response value must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify attempt belongs to user
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

    if (attempt.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Attempt is not in progress' },
        { status: 400 }
      );
    }

    // Insert or update response
    const { error: responseError } = await supabase
      .from('personality_responses')
      .upsert({
        attempt_id,
        question_id,
        response_value,
        response_time_ms: response_time_ms || null
      }, {
        onConflict: 'attempt_id,question_id'
      });

    if (responseError) {
      console.error('Error saving personality response:', responseError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    // Get response count
    const { count } = await supabase
      .from('personality_responses')
      .select('*', { count: 'exact', head: true })
      .eq('attempt_id', attempt_id);

    return NextResponse.json({
      success: true,
      responses_count: count || 0,
      total_questions: 50
    });

  } catch (error) {
    console.error('Error in /api/personality/respond:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

