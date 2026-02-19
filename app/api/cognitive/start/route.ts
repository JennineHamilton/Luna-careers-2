// =====================================================
// API Route: Start Cognitive Assessment
// POST /api/cognitive/start
// =====================================================

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    
    const { template_id } = await request.json();
    
    if (!template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Check if template exists and is active
    const { data: template, error: templateError } = await supabase
      .from('cognitive_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single();
    
    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 404 }
      );
    }
    
    // Check for existing incomplete attempt
    const { data: existingAttempt } = await supabase
      .from('cognitive_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('template_id', template_id)
      .is('completed_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();
    
    if (existingAttempt) {
      // Resume existing attempt
      const { data: questions } = await supabase
        .from('cognitive_questions')
        .select('*')
        .eq('template_id', template_id)
        .order('display_order', { ascending: true });
      
      return NextResponse.json({
        attempt_id: existingAttempt.id,
        questions: questions || [],
        resumed: true
      });
    }
    
    // Create new attempt
    const { data: newAttempt, error: attemptError } = await supabase
      .from('cognitive_attempts')
      .insert({
        user_id: user.id,
        template_id: template_id,
        started_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (attemptError || !newAttempt) {
      console.error('Error creating attempt:', attemptError);
      return NextResponse.json(
        { error: 'Failed to create assessment attempt' },
        { status: 500 }
      );
    }
    
    // Fetch all questions for this template
    const { data: questions, error: questionsError } = await supabase
      .from('cognitive_questions')
      .select('*')
      .eq('template_id', template_id)
      .order('display_order', { ascending: true });
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      attempt_id: newAttempt.id,
      questions: questions || [],
      resumed: false
    });
    
  } catch (error) {
    console.error('Error in cognitive/start:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

