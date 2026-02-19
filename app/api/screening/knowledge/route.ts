import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/knowledge
 * List all knowledge assessments (admin only)
 */
export async function GET(request: NextRequest) {
  try {
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

    const { data: assessments, error } = await supabase
      .from('knowledge_assessments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge assessments:', error);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error('Error in GET /api/screening/knowledge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/screening/knowledge
 * Create a new knowledge assessment with questions (admin only)
 */
export async function POST(request: NextRequest) {
  try {
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
    const {
      title,
      description,
      category,
      questions_per_attempt,
      passing_threshold,
      time_limit_minutes,
      allow_review,
      is_published,
      questions,
    } = body;

    // Validation
    if (!title || !category || !questions_per_attempt || !passing_threshold || !time_limit_minutes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'At least one question is required' }, { status: 400 });
    }

    // Simple validation: questions_per_attempt must be positive and not exceed available questions
    if (questions_per_attempt <= 0) {
      return NextResponse.json({
        error: 'Questions per attempt must be greater than 0'
      }, { status: 400 });
    }

    if (questions_per_attempt > questions.length) {
      return NextResponse.json({
        error: 'Questions per attempt cannot exceed total questions in pool'
      }, { status: 400 });
    }

    // Create assessment - simple and straightforward
    const { data: assessment, error: assessmentError } = await supabase
      .from('knowledge_assessments')
      .insert({
        title,
        description,
        category,
        questions_per_attempt, // Just set it directly
        passing_threshold,
        time_limit_minutes,
        allow_review: allow_review !== false,
        is_published: is_published === true,
      })
      .select()
      .single();

    if (assessmentError) {
      console.error('Error creating knowledge assessment:', assessmentError);
      return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
    }

    // Create questions - simple loop
    for (const question of questions) {
      const { data: createdQuestion, error: questionError } = await supabase
        .from('knowledge_questions')
        .insert({
          assessment_id: assessment.id,
          question_text: question.question_text,
          question_type: question.question_type,
          image_url: question.image_url,
        })
        .select()
        .single();

      if (questionError) {
        console.error('Error creating question:', questionError);
        continue;
      }

      // Create options for select questions (not for true/false)
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

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/screening/knowledge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

