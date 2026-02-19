import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const submitBadgeSchema = z.object({
  attempt_id: z.string().uuid(),
});

/**
 * POST /api/screening/badges/submit
 * Submit an attempt to user's profile as a skill badge
 * Creates or updates user_skill_badges record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = submitBadgeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { attempt_id } = validationResult.data;

    // Fetch attempt and verify ownership
    const { data: attempt, error: attemptError } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('user_id', user.id)
      .single();

    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found or unauthorized' }, { status: 404 });
    }

    // Check if attempt is completed
    if (attempt.status !== 'completed') {
      return NextResponse.json({ error: 'Attempt must be completed before submitting' }, { status: 400 });
    }

    // Check if user already has a badge for this assessment
    const { data: existingBadge } = await supabase
      .from('user_skill_badges')
      .select('*')
      .eq('user_id', user.id)
      .eq('assessment_template_id', attempt.assessment_template_id)
      .single();

    let badge;

    if (existingBadge) {
      // Update if new attempt is better
      if (attempt.skill_level_numeric && attempt.skill_level_numeric > (existingBadge.badge_level_numeric || 0)) {
        const { data: updatedBadge, error: updateError } = await supabase
          .from('user_skill_badges')
          .update({
            best_attempt_id: attempt_id,
            badge_level: attempt.skill_level || 'Beginner',
            badge_level_numeric: attempt.skill_level_numeric || 1,
            best_wpm: attempt.wpm || 0,
            best_accuracy: attempt.accuracy || 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingBadge.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating badge:', updateError);
          return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 });
        }

        badge = updatedBadge;
      } else {
        // Existing badge is better or equal
        badge = existingBadge;
      }
    } else {
      // Create new badge
      const { data: newBadge, error: insertError } = await supabase
        .from('user_skill_badges')
        .insert({
          user_id: user.id,
          assessment_template_id: attempt.assessment_template_id,
          best_attempt_id: attempt_id,
          badge_level: attempt.skill_level || 'Beginner',
          badge_level_numeric: attempt.skill_level_numeric || 1,
          best_wpm: attempt.wpm || 0,
          best_accuracy: attempt.accuracy || 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating badge:', insertError);
        return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 });
      }

      badge = newBadge;
    }

    // Mark attempt as submitted
    await supabase
      .from('assessment_attempts')
      .update({ is_submitted: true })
      .eq('id', attempt_id);

    return NextResponse.json({ badge });
  } catch (error) {
    console.error('Error in POST /api/screening/badges/submit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

