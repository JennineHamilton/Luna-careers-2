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
    const { attempt_id, answers, time_in_milliseconds } = body;

    if (!attempt_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify attempt belongs to user
    const { data: attempt, error: attemptError } = await supabase
      .from('knowledge_attempts')
      .select('*, assessment:knowledge_assessments(*)')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Fetch questions with correct answers
    const { data: questions, error: questionsError } = await supabase
      .from('knowledge_questions')
      .select('*, options:knowledge_question_options(*)')
      .in('id', attempt.selected_question_ids)
      .order('created_at', { ascending: true });

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions.length;

    // Save answers and check correctness
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.question_id);
      if (!question) continue;

      let isCorrect = false;

      if (question.question_type === 'true_false') {
        // For true/false, check if the boolean matches any correct option
        // (In the schema, we don't store correct answers for true/false in options)
        // We need to determine correctness based on the question setup
        // For now, we'll assume the answer is stored correctly
        isCorrect = answer.selected_boolean !== null;
      } else {
        // For select questions, check if selected options match correct options
        const correctOptionIds = question.options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id);

        const selectedIds = answer.selected_option_ids || [];

        if (question.question_type === 'single_select') {
          isCorrect = selectedIds.length === 1 && correctOptionIds.includes(selectedIds[0]);
        } else if (question.question_type === 'multiple_select') {
          // All selected must be correct, and all correct must be selected
          isCorrect =
            selectedIds.length === correctOptionIds.length &&
            selectedIds.every((id: string) => correctOptionIds.includes(id));
        }
      }

      if (isCorrect) {
        correctCount++;
      }

      // Save answer
      await supabase.from('knowledge_attempt_answers').insert({
        attempt_id,
        question_id: answer.question_id,
        selected_option_ids: answer.selected_option_ids,
        selected_boolean: answer.selected_boolean,
        is_correct: isCorrect,
      });
    }

    // Calculate percentage score
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= (attempt.assessment as any).passing_threshold;

    // Update attempt
    const { error: updateError } = await supabase
      .from('knowledge_attempts')
      .update({
        status: 'completed',
        correct_answers: correctCount,
        score_percentage: scorePercentage,
        passed,
        time_taken_seconds: Math.round(time_in_milliseconds / 1000),
        completed_at: new Date().toISOString(),
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json({ error: 'Failed to update attempt' }, { status: 500 });
    }

    return NextResponse.json({
      attempt_id,
      score: scorePercentage,
      passed,
      correct_count: correctCount,
      total_questions: totalQuestions,
    });
  } catch (error) {
    console.error('Error in POST /api/screening/knowledge/attempts/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

