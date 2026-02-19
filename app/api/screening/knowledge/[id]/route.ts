import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/knowledge/[id]
 * Get a single knowledge assessment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: assessment, error } = await supabase
      .from('knowledge_assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching knowledge assessment:', error);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Fetch questions
    const { data: questions, error: questionsError } = await supabase
      .from('knowledge_questions')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    }

    // Fetch options for each question
    const questionsWithOptions = await Promise.all(
      (questions || []).map(async (question) => {
        if (question.question_type === 'true_false') {
          return {
            ...question,
            options: [
              { id: 'true', option_text: 'True', is_correct: false, order_index: 0 },
              { id: 'false', option_text: 'False', is_correct: false, order_index: 1 },
            ],
          };
        }

        const { data: options } = await supabase
          .from('knowledge_question_options')
          .select('*')
          .eq('question_id', question.id)
          .order('order_index', { ascending: true });

        return {
          ...question,
          options: options || [],
        };
      })
    );

    return NextResponse.json({ assessment, questions: questionsWithOptions });
  } catch (error) {
    console.error('Error in GET /api/screening/knowledge/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/screening/knowledge/[id]
 * Update a knowledge assessment (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify platform admin
    const accountType = user.user_metadata?.account_type;
    if (accountType !== 'platformAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const updateData: any = {};

    // Build update data from provided fields
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.questions_per_attempt !== undefined) updateData.questions_per_attempt = body.questions_per_attempt;
    if (body.passing_threshold !== undefined) updateData.passing_threshold = body.passing_threshold;
    if (body.time_limit_minutes !== undefined) updateData.time_limit_minutes = body.time_limit_minutes;
    if (body.allow_review !== undefined) updateData.allow_review = body.allow_review;
    if (body.is_published !== undefined) updateData.is_published = body.is_published;

    // Simple validation
    if (updateData.questions_per_attempt !== undefined && updateData.questions_per_attempt < 1) {
      return NextResponse.json({ error: 'Questions per attempt must be at least 1' }, { status: 400 });
    }

    if (updateData.passing_threshold !== undefined &&
        (updateData.passing_threshold < 0 || updateData.passing_threshold > 100)) {
      return NextResponse.json({ error: 'Passing threshold must be between 0 and 100' }, { status: 400 });
    }

    if (updateData.time_limit_minutes !== undefined && updateData.time_limit_minutes < 1) {
      return NextResponse.json({ error: 'Time limit must be at least 1 minute' }, { status: 400 });
    }

    // Validate questions_per_attempt against total questions if questions are provided
    if (body.questions && body.questions_per_attempt && body.questions_per_attempt > body.questions.length) {
      return NextResponse.json(
        { error: 'Questions per attempt cannot exceed total questions in pool' },
        { status: 400 }
      );
    }

    // If questions are provided, delete existing questions first
    if (body.questions) {
      const { error: deleteError } = await supabase
        .from('knowledge_questions')
        .delete()
        .eq('assessment_id', id);

      if (deleteError) {
        console.error('Error deleting questions:', deleteError);
      }
    }

    // Update assessment
    const { data: assessment, error } = await supabase
      .from('knowledge_assessments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating knowledge assessment:', error);
      return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
    }

    // If questions are provided, create new ones
    if (body.questions) {
      for (const question of body.questions) {
        const { data: createdQuestion, error: questionError } = await supabase
          .from('knowledge_questions')
          .insert({
            assessment_id: id,
            question_text: question.question_text,
            question_type: question.question_type,
            image_url: question.image_url,
          })
          .select()
          .single();

        if (questionError) {
          console.error('Error creating question:', questionError);
          return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
        }

        // Create options if not true/false
        if (question.question_type !== 'true_false' && question.options) {
          const optionsToInsert = question.options.map((opt: any, index: number) => ({
            question_id: createdQuestion.id,
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            order_index: index,
          }));

          const { error: optionsError } = await supabase
            .from('knowledge_question_options')
            .insert(optionsToInsert);

          if (optionsError) {
            console.error('Error creating options:', optionsError);
          }
        }
      }
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('Error in PATCH /api/screening/knowledge/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/screening/knowledge/[id]
 * Delete a knowledge assessment (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify platform admin
    const accountType = user.user_metadata?.account_type;
    console.log('Delete attempt - User ID:', user.id, 'Account Type:', accountType);

    if (accountType !== 'platformAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if assessment exists first
    const { data: assessment, error: fetchError } = await supabase
      .from('knowledge_assessments')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchError || !assessment) {
      console.error('Assessment not found:', fetchError);
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    console.log('Attempting to delete assessment:', assessment.title);

    const { error } = await supabase
      .from('knowledge_assessments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting knowledge assessment:', error);
      return NextResponse.json({
        error: 'Failed to delete assessment',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/screening/knowledge/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

