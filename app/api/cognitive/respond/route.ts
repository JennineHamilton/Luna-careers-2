// =====================================================
// API Route: Save Cognitive Assessment Response
// POST /api/cognitive/respond
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
    
    const { 
      attempt_id, 
      question_id, 
      user_answer, 
      is_correct, 
      time_taken_seconds,
      is_practice 
    } = await request.json();
    
    // Validate required fields
    if (!attempt_id || !question_id || user_answer === undefined || is_correct === undefined || time_taken_seconds === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    
    // Check if attempt is already completed
    if (attempt.completed_at) {
      return NextResponse.json(
        { error: 'Attempt already completed' },
        { status: 400 }
      );
    }
    
    // Check if response already exists (prevent duplicates)
    const { data: existingResponse } = await supabase
      .from('cognitive_responses')
      .select('id')
      .eq('attempt_id', attempt_id)
      .eq('question_id', question_id)
      .single();
    
    if (existingResponse) {
      // Update existing response
      const { error: updateError } = await supabase
        .from('cognitive_responses')
        .update({
          user_answer,
          is_correct,
          time_taken_seconds,
          is_practice: is_practice || false
        })
        .eq('id', existingResponse.id);
      
      if (updateError) {
        console.error('Error updating response:', updateError);
        return NextResponse.json(
          { error: 'Failed to update response' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, updated: true });
    }
    
    // Save new response
    const { error: responseError } = await supabase
      .from('cognitive_responses')
      .insert({
        attempt_id,
        question_id,
        user_answer,
        is_correct,
        time_taken_seconds,
        is_practice: is_practice || false
      });
    
    if (responseError) {
      console.error('Error saving response:', responseError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, updated: false });
    
  } catch (error) {
    console.error('Error in cognitive/respond:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

