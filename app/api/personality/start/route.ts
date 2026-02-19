/**
 * POST /api/personality/start
 * Start a new personality assessment attempt
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
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

    // Get the Professional Personality Profile template
    const { data: template, error: templateError } = await supabase
      .from('assessment_templates')
      .select('id')
      .eq('title', 'Professional Personality Profile')
      .eq('is_system_managed', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Personality assessment template not found' },
        { status: 404 }
      );
    }

    // Check if user has an in-progress attempt
    const { data: existingAttempt } = await supabase
      .from('personality_attempts')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('assessment_template_id', template.id)
      .eq('status', 'in_progress')
      .single();

    if (existingAttempt) {
      // Return existing attempt
      return NextResponse.json({
        attempt_id: existingAttempt.id,
        message: 'Resuming existing attempt'
      });
    }

    // Create new attempt
    const { data: newAttempt, error: attemptError } = await supabase
      .from('personality_attempts')
      .insert({
        user_id: user.id,
        assessment_template_id: template.id,
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (attemptError) {
      console.error('Error creating personality attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to start assessment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      attempt_id: newAttempt.id,
      message: 'Assessment started successfully'
    });

  } catch (error) {
    console.error('Error in /api/personality/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

