// =====================================================
// API Route: Get Cognitive Assessment Results
// GET /api/cognitive/results/[attemptId]
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
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

    const { attemptId } = await params;
    
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('cognitive_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .single();
    
    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Check if completed
    if (!attempt.completed_at) {
      return NextResponse.json(
        { error: 'Attempt not yet completed' },
        { status: 400 }
      );
    }
    
    // Fetch responses
    const { data: responses, error: responsesError } = await supabase
      .from('cognitive_responses')
      .select('*')
      .eq('attempt_id', attemptId);
    
    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }
    
    // Fetch insights
    const { data: insights, error: insightsError } = await supabase
      .from('cognitive_insights')
      .select('*')
      .eq('attempt_id', attemptId);
    
    if (insightsError) {
      console.error('Error fetching insights:', insightsError);
      // Don't fail the request if insights fail to fetch
    }
    
    // Build domain scores from attempt data
    const domainScores = [
      {
        domain: 'verbal' as const,
        raw_score: attempt.verbal_raw_score || 0,
        percentile: attempt.verbal_percentile || 0,
        correct_count: responses?.filter(r => !r.is_practice && r.is_correct && r.question_id?.includes('verbal')).length || 0,
        total_count: 10,
        average_time_seconds: 0 // Can calculate if needed
      },
      {
        domain: 'numerical' as const,
        raw_score: attempt.numerical_raw_score || 0,
        percentile: attempt.numerical_percentile || 0,
        correct_count: responses?.filter(r => !r.is_practice && r.is_correct && r.question_id?.includes('numerical')).length || 0,
        total_count: 10,
        average_time_seconds: 0
      },
      {
        domain: 'abstract' as const,
        raw_score: attempt.abstract_raw_score || 0,
        percentile: attempt.abstract_percentile || 0,
        correct_count: responses?.filter(r => !r.is_practice && r.is_correct && r.question_id?.includes('abstract')).length || 0,
        total_count: 10,
        average_time_seconds: 0
      },
      {
        domain: 'attention' as const,
        raw_score: attempt.attention_raw_score || 0,
        percentile: attempt.attention_percentile || 0,
        correct_count: responses?.filter(r => !r.is_practice && r.is_correct && r.question_id?.includes('attention')).length || 0,
        total_count: 10,
        average_time_seconds: 0
      }
    ];
    
    return NextResponse.json({
      attempt,
      domain_scores: domainScores,
      insights: insights || [],
      responses: responses || []
    });
    
  } catch (error) {
    console.error('Error in cognitive/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

