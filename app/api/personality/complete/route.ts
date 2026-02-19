/**
 * POST /api/personality/complete
 * Complete the assessment, calculate scores, and generate reports
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { calculateBigFiveScores, calculatePercentiles } from '@/lib/utils/personality-scoring';
import { generateWorkplaceInsights, generateJobRecommendations } from '@/lib/utils/personality-insights';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { attempt_id } = body;

    if (!attempt_id) {
      return NextResponse.json(
        { error: 'Missing attempt_id' },
        { status: 400 }
      );
    }

    // Verify attempt belongs to user
    const { data: attempt, error: attemptError } = await supabase
      .from('personality_attempts')
      .select('id, user_id, status')
      .eq('id', attempt_id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json(
        { error: 'Attempt not found' },
        { status: 404 }
      );
    }

    if (attempt.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all responses with question details
    const { data: responses, error: responsesError } = await supabase
      .from('personality_responses')
      .select(`
        id,
        question_id,
        response_value,
        response_time_ms,
        personality_questions (
          id,
          question_number,
          question_text,
          dimension,
          is_reversed
        )
      `)
      .eq('attempt_id', attempt_id);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    // Validate we have all 50 responses
    if (!responses || responses.length !== 50) {
      return NextResponse.json(
        { error: `Incomplete assessment - ${responses?.length || 0}/50 questions answered` },
        { status: 400 }
      );
    }

    // Transform responses to match expected format
    const formattedResponses = responses
      .filter(r => r.personality_questions !== null && r.question_id !== null)
      .map(r => ({
        id: r.id,
        question_id: r.question_id!,
        response_value: r.response_value,
        question: {
          id: r.personality_questions!.id,
          question_number: r.personality_questions!.question_number,
          question_text: r.personality_questions!.question_text,
          dimension: r.personality_questions!.dimension,
          is_reversed: r.personality_questions!.is_reversed
        }
      }));

    // Calculate Big Five scores using validated algorithm
    const scores = calculateBigFiveScores(formattedResponses);
    const percentiles = calculatePercentiles(scores);

    // Update attempt with scores
    const { error: updateError } = await supabase
      .from('personality_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        extraversion_score: scores.extraversion,
        agreeableness_score: scores.agreeableness,
        conscientiousness_score: scores.conscientiousness,
        emotional_stability_score: scores.emotional_stability,
        intellect_score: scores.intellect,
        extraversion_percentile: percentiles.extraversion,
        agreeableness_percentile: percentiles.agreeableness,
        conscientiousness_percentile: percentiles.conscientiousness,
        emotional_stability_percentile: percentiles.emotional_stability,
        intellect_percentile: percentiles.intellect,
        updated_at: new Date().toISOString()
      })
      .eq('id', attempt_id);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json(
        { error: 'Failed to save scores' },
        { status: 500 }
      );
    }

    // Generate research-backed insights
    const insights = generateWorkplaceInsights(scores, percentiles);
    const jobRecommendations = generateJobRecommendations(scores, percentiles);

    // Save insights to database
    for (const insight of insights) {
      await supabase.from('personality_insights').insert({
        attempt_id,
        user_id: user.id,
        insight_type: insight.category.toLowerCase().replace(/ /g, '_'),
        category: insight.category,
        title: insight.title,
        description: insight.description,
        research_source: insight.research_source,
        confidence_level: insight.confidence_level,
        applicable_dimensions: insight.applicable_dimensions,
        percentile_trigger: insight.percentile_trigger
      });
    }

    // Save job recommendations
    for (const rec of jobRecommendations) {
      await supabase.from('personality_job_recommendations').insert({
        attempt_id,
        user_id: user.id,
        job_family: rec.job_family,
        match_strength: rec.match_strength,
        example_roles: rec.example_roles,
        rationale: rec.rationale,
        research_source: rec.research_source
      });
    }

    return NextResponse.json({
      success: true,
      scores,
      percentiles,
      insights_count: insights.length,
      recommendations_count: jobRecommendations.length
    });

  } catch (error) {
    console.error('Error in /api/personality/complete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

