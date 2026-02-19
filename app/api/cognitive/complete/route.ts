// =====================================================
// API Route: Complete Cognitive Assessment
// POST /api/cognitive/complete
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { calculateDomainScore, calculateOverallScore } from '@/lib/cognitive/scoring';
import { generateInsights } from '@/lib/cognitive/insights-generator';
import type { CognitiveDomain } from '@/lib/cognitive/types';

export async function POST(request: Request) {
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
    
    const { attempt_id } = await request.json();
    
    if (!attempt_id) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }
    
    // Verify attempt belongs to user
    const { data: attempt, error: attemptError } = await supabase
      .from('cognitive_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();
    
    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found or unauthorized' },
        { status: 404 }
      );
    }
    
    // Check if already completed
    if (attempt.completed_at) {
      return NextResponse.json(
        { error: 'Attempt already completed' },
        { status: 400 }
      );
    }

    // Validate template_id exists
    if (!attempt.template_id) {
      return NextResponse.json(
        { error: 'Invalid attempt: missing template_id' },
        { status: 400 }
      );
    }

    // Fetch all responses for this attempt
    const { data: responses, error: responsesError } = await supabase
      .from('cognitive_responses')
      .select('*')
      .eq('attempt_id', attempt_id);
    
    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }
    
    // Fetch all questions for this template
    const { data: questions, error: questionsError } = await supabase
      .from('cognitive_questions')
      .select('*')
      .eq('template_id', attempt.template_id);
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }
    
    // Calculate scores for each domain
    const domains: CognitiveDomain[] = ['verbal', 'numerical', 'abstract', 'attention'];
    const domainScores = await Promise.all(
      domains.map(domain => calculateDomainScore(domain, responses || [], questions || []))
    );
    
    // Calculate overall score
    const overallScore = await calculateOverallScore(domainScores);
    
    // Calculate total time
    const realResponses = (responses || []).filter(r => !r.is_practice);
    const totalTime = realResponses.reduce((sum, r) => sum + r.time_taken_seconds, 0);
    
    // Update attempt with scores
    const { error: updateError } = await supabase
      .from('cognitive_attempts')
      .update({
        completed_at: new Date().toISOString(),
        overall_score: overallScore.raw_score,
        overall_percentile: overallScore.percentile,
        verbal_score: domainScores.find(s => s.domain === 'verbal')?.raw_score,
        verbal_percentile: domainScores.find(s => s.domain === 'verbal')?.percentile,
        numerical_score: domainScores.find(s => s.domain === 'numerical')?.raw_score,
        numerical_percentile: domainScores.find(s => s.domain === 'numerical')?.percentile,
        abstract_score: domainScores.find(s => s.domain === 'abstract')?.raw_score,
        abstract_percentile: domainScores.find(s => s.domain === 'abstract')?.percentile,
        attention_score: domainScores.find(s => s.domain === 'attention')?.raw_score,
        attention_percentile: domainScores.find(s => s.domain === 'attention')?.percentile,
        total_time_seconds: Math.round(totalTime)
      })
      .eq('id', attempt_id);
    
    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json(
        { error: 'Failed to update attempt' },
        { status: 500 }
      );
    }
    
    // Generate insights
    const insights = generateInsights(domainScores);

    // Save insights to database
    const insightsToInsert = insights.map(insight => ({
      attempt_id,
      insight_type: insight.category, // Map category to insight_type
      domain: insight.domain,
      title: insight.title,
      description: insight.description
    }));
    
    const { error: insightsError } = await supabase
      .from('cognitive_insights')
      .insert(insightsToInsert);
    
    if (insightsError) {
      console.error('Error saving insights:', insightsError);
      // Don't fail the request if insights fail to save
    }
    
    return NextResponse.json({
      success: true,
      attempt_id,
      overall_score: overallScore.raw_score,
      overall_percentile: overallScore.percentile,
      domain_scores: domainScores
    });
    
  } catch (error) {
    console.error('Error in cognitive/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

