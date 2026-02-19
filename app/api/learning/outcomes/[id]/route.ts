/**
 * API Route: Individual Learning Outcome Operations
 * GET /api/learning/outcomes/[id] - Get single learning outcome
 * PATCH /api/learning/outcomes/[id] - Update learning outcome (admin only)
 * DELETE /api/learning/outcomes/[id] - Delete learning outcome (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type LearningOutcomeUpdate = Database['public']['Tables']['learning_outcomes']['Update'];

/**
 * GET /api/learning/outcomes/[id]
 * Get single learning outcome by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: outcome, error } = await supabase
      .from('learning_outcomes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Learning outcome not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch learning outcome', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ outcome }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/outcomes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/outcomes/[id]
 * Update learning outcome (platform admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single();
    
    if (userData?.account_type !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { outcome_text, category } = body;

    const updateData: LearningOutcomeUpdate = {};
    if (outcome_text !== undefined) updateData.outcome_text = outcome_text;
    if (category !== undefined) updateData.category = category;
    
    const { data: outcome, error: updateError } = await supabase
      .from('learning_outcomes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating learning outcome:', updateError);
      return NextResponse.json(
        { error: 'Failed to update learning outcome', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ outcome }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/outcomes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/outcomes/[id]
 * Delete learning outcome (platform admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single();
    
    if (userData?.account_type !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }
    
    const { error: deleteError } = await supabase
      .from('learning_outcomes')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting learning outcome:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete learning outcome', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/outcomes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

