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
    const { assessment_id, selected_question_ids } = body;

    if (!assessment_id || !selected_question_ids || !Array.isArray(selected_question_ids)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Create attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('knowledge_attempts')
      .insert({
        user_id: user.id,
        assessment_id,
        selected_question_ids,
        total_questions: selected_question_ids.length,
        status: 'in_progress',
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating knowledge attempt:', attemptError);
      return NextResponse.json({ error: 'Failed to create attempt' }, { status: 500 });
    }

    return NextResponse.json({ attempt_id: attempt.id });
  } catch (error) {
    console.error('Error in POST /api/screening/knowledge/attempts/start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

