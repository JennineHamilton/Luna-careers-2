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
    const { assessment_id } = body;

    if (!assessment_id) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 });
    }

    // Fetch assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('knowledge_assessments')
      .select('*')
      .eq('id', assessment_id)
      .eq('is_active', true)
      .single();

    if (assessmentError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Fetch all questions for this assessment
    const { data: allQuestions, error: questionsError } = await supabase
      .from('knowledge_questions')
      .select('*')
      .eq('assessment_id', assessment_id);

    if (questionsError || !allQuestions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Randomly select questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, assessment.questions_per_attempt);

    // Fetch options for selected questions
    const questionsWithOptions = await Promise.all(
      selectedQuestions.map(async (question) => {
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
          .select('id, option_text, order_index')
          .eq('question_id', question.id)
          .order('order_index', { ascending: true });

        return {
          ...question,
          options: options || [],
        };
      })
    );

    return NextResponse.json({
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        time_limit_minutes: assessment.time_limit_minutes,
        allow_review: assessment.allow_review,
        passing_threshold: assessment.passing_threshold,
      },
      questions: questionsWithOptions,
    });
  } catch (error) {
    console.error('Error in POST /api/screening/knowledge/attempts/prepare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

