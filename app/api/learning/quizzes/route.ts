/**
 * API Route: /api/learning/quizzes
 * Handles quiz management operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import { validateBody } from '@/lib/validation/validate';
import { quizCreateSchema } from '@/lib/validation/schemas';
import type { Database } from '@/types/database.types';

type QuizInsert = Database['public']['Tables']['quizzes']['Insert'];
type QuizQuestionInsert = Database['public']['Tables']['quiz_questions']['Insert'];
type QuizQuestionOptionInsert = Database['public']['Tables']['quiz_question_options']['Insert'];

/**
 * GET /api/learning/quizzes
 * Fetch all quizzes (platform admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify platform admin
    const authResult = await requirePlatformAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = createAdminClient();

    // Fetch all quizzes with question count
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          id
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quizzes', details: error.message },
        { status: 500 }
      );
    }

    // Transform data to include question count
    const quizzesWithCount = quizzes?.map(quiz => ({
      ...quiz,
      question_count: quiz.quiz_questions?.length || 0,
      quiz_questions: undefined, // Remove the nested array
    })) || [];

    return NextResponse.json({ quizzes: quizzesWithCount }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/quizzes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/quizzes
 * Create new quiz with questions and options (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify platform admin
    const authResult = await requirePlatformAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = createAdminClient();

    // Parse and validate request body
    const body = await request.json();
    console.log('[POST /api/learning/quizzes] Request body:', JSON.stringify(body, null, 2));

    // Validate with Zod schema directly
    const result = quizCreateSchema.safeParse(body);
    if (!result.success) {
      console.error('[POST /api/learning/quizzes] Validation failed:', result.error.issues);
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validation = { success: true as const, data: result.data };

    const {
      name,
      description,
      duration_minutes,
      number_of_questions,
      is_graded,
      passing_score,
      questions
    } = validation.data;

    // Create quiz
    const quizData: QuizInsert = {
      name,
      description: description || null,
      duration_minutes,
      number_of_questions,
      is_graded: is_graded ?? true,
      passing_score: passing_score || null,
    };

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert(quizData)
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return NextResponse.json(
        { error: 'Failed to create quiz', details: quizError.message },
        { status: 500 }
      );
    }

    // Create questions and options
    for (const question of questions) {
      const questionData: QuizQuestionInsert = {
        quiz_id: quiz.id,
        question_text: question.question_text,
        question_type: question.question_type,
        image_url: question.image_url || null,
        order_index: question.order_index,
      };

      const { data: createdQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert(questionData)
        .select()
        .single();

      if (questionError) {
        console.error('Error creating question:', questionError);
        // Rollback: delete the quiz
        await supabase.from('quizzes').delete().eq('id', quiz.id);
        return NextResponse.json(
          { error: 'Failed to create question', details: questionError.message },
          { status: 500 }
        );
      }

      // Create options for this question
      const optionsData: QuizQuestionOptionInsert[] = question.options.map(option => ({
        question_id: createdQuestion.id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        order_index: option.order_index,
      }));

      const { error: optionsError } = await supabase
        .from('quiz_question_options')
        .insert(optionsData);

      if (optionsError) {
        console.error('Error creating options:', optionsError);
        // Rollback: delete the quiz (cascade will delete questions)
        await supabase.from('quizzes').delete().eq('id', quiz.id);
        return NextResponse.json(
          { error: 'Failed to create options', details: optionsError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/quizzes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

