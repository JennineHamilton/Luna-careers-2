import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { calculateTypingMetrics, validateTypingResults } from '@/lib/utils/typing-calculations';
import { calculateSkillBadge } from '@/lib/utils/badge-calculator';
import { generatePerformanceReport } from '@/lib/ai/generate-performance-report';
import type { Database } from '@/types/database.types';

type AssessmentAttemptUpdate = Database['public']['Tables']['assessment_attempts']['Update'];
type UserSkillBadgeInsert = Database['public']['Tables']['user_skill_badges']['Insert'];

const submitAttemptSchema = z.object({
  attempt_id: z.string().uuid(),
  user_input: z.string(),
  correct_characters: z.number().int().min(0),
  error_characters: z.number().int().min(0),
  time_in_milliseconds: z.number().int().min(1),
});

/**
 * POST /api/screening/attempts/submit
 * Submit a completed assessment attempt
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request
    const body = await request.json();
    const validationResult = submitAttemptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { attempt_id, user_input, correct_characters, error_characters, time_in_milliseconds } = validationResult.data;

    // Validate typing results
    const resultsValidation = validateTypingResults(correct_characters, error_characters, time_in_milliseconds);
    if (!resultsValidation.valid) {
      return NextResponse.json(
        { error: resultsValidation.error },
        { status: 400 }
      );
    }

    // Fetch the attempt
    const { data: attempt, error: fetchError } = await supabase
      .from('assessment_attempts')
      .select('*, assessment_template:assessment_templates(*)')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }
      console.error('Error fetching attempt:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch attempt' }, { status: 500 });
    }

    // Check if already submitted
    if (attempt.is_submitted) {
      return NextResponse.json(
        { error: 'This attempt has already been submitted' },
        { status: 400 }
      );
    }

    // Calculate metrics
    const metrics = calculateTypingMetrics(correct_characters, error_characters, time_in_milliseconds);
    
    // Calculate badge
    const badge = calculateSkillBadge(metrics.wpm, metrics.accuracy);

    // Generate performance report
    const performanceReport = await generatePerformanceReport({
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      timeInSeconds: metrics.timeInSeconds,
      skillLevel: badge.name,
      skillLevelNumeric: badge.levelNumeric,
      assessmentType: attempt.assessment_template?.assessment_type || 'typing',
      language: attempt.assessment_template?.language || 'English',
    });

    // Update attempt
    const updateData: AssessmentAttemptUpdate = {
      user_input,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      time_taken: metrics.timeInSeconds,
      errors_count: error_characters,
      characters_typed: metrics.totalCharacters,
      correct_characters,
      performance_report: performanceReport,
      skill_level: badge.level,
      skill_level_numeric: badge.levelNumeric,
      status: 'completed',
      is_submitted: true,
      completed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    };

    const { data: updatedAttempt, error: updateError } = await supabase
      .from('assessment_attempts')
      .update(updateData)
      .eq('id', attempt_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating attempt:', updateError);
      return NextResponse.json({ error: 'Failed to submit attempt' }, { status: 500 });
    }

    // Check if this is the user's best score for this assessment
    const { data: existingBadge } = await supabase
      .from('user_skill_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('assessment_template_id', attempt.assessment_template_id)
      .single();

    const shouldUpdateBadge = !existingBadge || metrics.wpm > (existingBadge.best_wpm || 0);

    if (shouldUpdateBadge) {
      const badgeData: UserSkillBadgeInsert = {
        user_id: user.id,
        assessment_template_id: attempt.assessment_template_id,
        best_attempt_id: attempt_id,
        best_wpm: metrics.wpm,
        best_accuracy: metrics.accuracy,
        badge_level: badge.level,
        badge_level_numeric: badge.levelNumeric,
        badge_color: badge.color,
        display_on_profile: true,
        earned_at: new Date().toISOString(),
      };

      const { error: badgeError } = await supabase
        .from('user_skill_badges')
        .upsert(badgeData, {
          onConflict: 'user_id,assessment_template_id',
        });

      if (badgeError) {
        console.error('Error upserting badge:', badgeError);
        // Don't fail the request, badge update is secondary
      }
    }

    return NextResponse.json({
      attempt: updatedAttempt,
      metrics,
      badge,
      performance_report: performanceReport,
      is_new_best: shouldUpdateBadge,
      message: 'Assessment submitted successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/screening/attempts/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

