import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createQuizAttemptSchema = z.object({
  quiz_id: z.string().uuid(),
  user_id: z.string().uuid(),
  score: z.number().int().min(0),
  total_questions: z.number().int().min(1),
  percentage: z.number().min(0).max(100),
  passed: z.boolean(),
  time_taken_seconds: z.number().int().min(0),
  answers: z.array(z.object({
    question_id: z.string().uuid(),
    selected_option_ids: z.array(z.string().uuid()),
  })),
});

// GET - Fetch latest quiz attempt for a user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();

    if (!authResult.authorized) {
      return authResult.error;
    }

    const user = authResult.user;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quiz_id');

    if (!quizId) {
      return NextResponse.json(
        { error: 'quiz_id is required' },
        { status: 400 }
      );
    }

    // Fetch the latest attempt for this quiz by this user
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching quiz attempt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz attempt' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('Error in GET /api/learning/quiz-attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST /api/learning/quiz-attempts] Starting request');
    const authResult = await requireAuth();

    if (!authResult.authorized) {
      console.error('[POST /api/learning/quiz-attempts] Authentication failed');
      return authResult.error;
    }

    const user = authResult.user;
    console.log('[POST /api/learning/quiz-attempts] Authenticated user:', user.id);
    const supabase = await createClient();

    const body = await request.json();
    console.log('[POST /api/learning/quiz-attempts] Request body user_id:', body.user_id);
    const validatedData = createQuizAttemptSchema.parse(body);

    // Verify user can only create attempts for themselves
    if (validatedData.user_id !== user.id) {
      console.error('[POST /api/learning/quiz-attempts] User ID mismatch:', {
        validatedUserId: validatedData.user_id,
        authenticatedUserId: user.id,
        match: validatedData.user_id === user.id,
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('[POST /api/learning/quiz-attempts] User ID verified, creating attempt');

    // Create quiz attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: validatedData.quiz_id,
        user_id: validatedData.user_id,
        score: validatedData.score,
        total_questions: validatedData.total_questions,
        percentage: validatedData.percentage,
        passed: validatedData.passed,
        started_at: new Date(Date.now() - validatedData.time_taken_seconds * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        time_taken_seconds: validatedData.time_taken_seconds,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating quiz attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to create quiz attempt' },
        { status: 500 }
      );
    }

    // Create quiz attempt answers
    if (validatedData.answers.length > 0) {
      const answersToInsert = validatedData.answers.map(answer => ({
        attempt_id: attempt.id,
        question_id: answer.question_id,
        selected_option_ids: answer.selected_option_ids,
      }));

      const { error: answersError } = await supabase
        .from('quiz_attempt_answers')
        .insert(answersToInsert);

      if (answersError) {
        console.error('Error creating quiz attempt answers:', answersError);
        // Don't fail the request if answers fail to save
      }
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score: attempt.percentage,
      passed: attempt.passed,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error in POST /api/learning/quiz-attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

