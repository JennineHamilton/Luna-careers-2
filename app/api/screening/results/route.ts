/**
 * GET /api/screening/results
 * Get all screening assessment results for the authenticated user
 * Returns: personality assessments, typing tests, transcription tests
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

    // Fetch personality assessment results (only display_on_profile = true)
    const { data: personalityAttempts, error: personalityError } = await supabase
      .from('personality_attempts')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        extraversion_score,
        agreeableness_score,
        conscientiousness_score,
        emotional_stability_score,
        intellect_score,
        extraversion_percentile,
        agreeableness_percentile,
        conscientiousness_percentile,
        emotional_stability_percentile,
        intellect_percentile,
        personality_insights (
          insight_type,
          category,
          title,
          description,
          confidence_level
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('display_on_profile', true)
      .order('completed_at', { ascending: false });

    if (personalityError) {
      console.error('Error fetching personality attempts:', personalityError);
    }

    // Fetch typing test results (only display_on_profile = true)
    const { data: typingAttempts, error: typingError } = await supabase
      .from('assessment_attempts')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        wpm,
        accuracy,
        errors_count,
        time_taken,
        skill_level,
        performance_report,
        assessment_template:assessment_templates!inner (
          id,
          title,
          assessment_type
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('is_submitted', true)
      .eq('display_on_profile', true)
      .eq('assessment_templates.assessment_type', 'typing')
      .order('completed_at', { ascending: false });

    if (typingError) {
      console.error('Error fetching typing attempts:', typingError);
    }

    // Fetch transcription test results (only display_on_profile = true)
    const { data: transcriptionAttempts, error: transcriptionError } = await supabase
      .from('assessment_attempts')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        wpm,
        accuracy,
        errors_count,
        time_taken,
        skill_level,
        performance_report,
        assessment_template:assessment_templates!inner (
          id,
          title,
          assessment_type
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('is_submitted', true)
      .eq('display_on_profile', true)
      .eq('assessment_templates.assessment_type', 'transcription')
      .order('completed_at', { ascending: false });

    if (transcriptionError) {
      console.error('Error fetching transcription attempts:', transcriptionError);
    }

    // Fetch cognitive assessment results (only display_on_profile = true)
    const { data: cognitiveAttempts, error: cognitiveError } = await supabase
      .from('cognitive_attempts')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        overall_percentile,
        verbal_percentile,
        numerical_percentile,
        abstract_percentile,
        attention_percentile,
        correct_answers,
        total_questions,
        cognitive_insights (
          insight_type,
          domain,
          title,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('display_on_profile', true)
      .order('completed_at', { ascending: false });

    if (cognitiveError) {
      console.error('Error fetching cognitive attempts:', cognitiveError);
    }

    // Fetch knowledge assessment results (only display_on_profile = true)
    const { data: knowledgeAttempts, error: knowledgeError } = await supabase
      .from('knowledge_attempts')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        total_questions,
        correct_answers,
        score_percentage,
        passed,
        time_taken_seconds,
        assessment:knowledge_assessments (
          id,
          title,
          category,
          passing_threshold
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .eq('display_on_profile', true)
      .order('completed_at', { ascending: false });

    if (knowledgeError) {
      console.error('Error fetching knowledge attempts:', knowledgeError);
    }

    return NextResponse.json({
      personality: personalityAttempts || [],
      typing: typingAttempts || [],
      transcription: transcriptionAttempts || [],
      cognitive: cognitiveAttempts || [],
      knowledge: knowledgeAttempts || [],
      summary: {
        total_assessments:
          (personalityAttempts?.length || 0) +
          (typingAttempts?.length || 0) +
          (transcriptionAttempts?.length || 0) +
          (cognitiveAttempts?.length || 0) +
          (knowledgeAttempts?.length || 0),
        has_personality: (personalityAttempts?.length || 0) > 0,
        has_typing: (typingAttempts?.length || 0) > 0,
        has_transcription: (transcriptionAttempts?.length || 0) > 0,
        has_cognitive: (cognitiveAttempts?.length || 0) > 0,
        has_knowledge: (knowledgeAttempts?.length || 0) > 0,
      }
    });

  } catch (error) {
    console.error('Error in /api/screening/results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

