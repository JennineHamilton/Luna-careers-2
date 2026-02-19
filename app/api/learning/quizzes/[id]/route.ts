/**
 * API Route: /api/learning/quizzes/[id]
 * Handles individual quiz operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import { validateBody } from '@/lib/validation/validate';
import { quizUpdateSchema } from '@/lib/validation/schemas';
import type { Database } from '@/types/database.types';

type QuizUpdate = Database['public']['Tables']['quizzes']['Update'];

/**
 * GET /api/learning/quizzes/[id]
 * Fetch single quiz with all questions and options (platform admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await requirePlatformAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = createAdminClient();
    const { id } = await params;

    // Fetch quiz with questions and options
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions (
          *,
          quiz_question_options (
            *
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching quiz:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quiz', details: error.message },
        { status: 500 }
      );
    }

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Sort questions and options by order_index
    if (quiz.quiz_questions) {
      quiz.quiz_questions.sort((a, b) => a.order_index - b.order_index);
      quiz.quiz_questions.forEach(question => {
        if (question.quiz_question_options) {
          question.quiz_question_options.sort((a, b) => a.order_index - b.order_index);
        }
      });
    }

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/quizzes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/quizzes/[id]
 * Update quiz metadata (platform admin only)
 * Note: Questions are not updated through this endpoint
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await requirePlatformAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = createAdminClient();
    const { id } = await params;

    // Validate request body
    const validation = await validateBody(request, quizUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      name,
      description,
      duration_minutes,
      number_of_questions,
      is_graded,
      passing_score
    } = validation.data;

    // Build update object
    const updateData: QuizUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
    if (number_of_questions !== undefined) updateData.number_of_questions = number_of_questions;
    if (is_graded !== undefined) updateData.is_graded = is_graded;
    if (passing_score !== undefined) updateData.passing_score = passing_score;

    const { data: quiz, error: updateError } = await supabase
      .from('quizzes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating quiz:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quiz', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ quiz }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/quizzes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/quizzes/[id]
 * Delete quiz (platform admin only)
 * Cascade deletes questions, options, attempts, and answers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await requirePlatformAdmin();
    if (!authResult.authorized) {
      return authResult.error;
    }

    const supabase = createAdminClient();
    const { id } = await params;

    // Delete quiz (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting quiz:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete quiz', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/quizzes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

