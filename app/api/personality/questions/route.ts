/**
 * GET /api/personality/questions
 * Get all 50 IPIP personality questions in randomized order
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
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

    // Get all 50 IPIP questions
    const { data: questions, error: questionsError } = await supabase
      .from('personality_questions')
      .select('*')
      .order('question_number', { ascending: true });

    if (questionsError) {
      console.error('Error fetching personality questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    if (!questions || questions.length !== 50) {
      return NextResponse.json(
        { error: 'Invalid question set - expected 50 questions' },
        { status: 500 }
      );
    }

    // Randomize question order while maintaining validation
    // We'll shuffle the questions but keep track of original question_number
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      questions: shuffledQuestions,
      total: shuffledQuestions.length
    });

  } catch (error) {
    console.error('Error in /api/personality/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

