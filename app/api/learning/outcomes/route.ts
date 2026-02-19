/**
 * API Route: Learning Outcomes Management
 * GET /api/learning/outcomes - List all learning outcomes
 * POST /api/learning/outcomes - Create new learning outcome (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type LearningOutcome = Database['public']['Tables']['learning_outcomes']['Row'];
type LearningOutcomeInsert = Database['public']['Tables']['learning_outcomes']['Insert'];

/**
 * GET /api/learning/outcomes
 * List all learning outcomes (public access)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query = supabase
      .from('learning_outcomes')
      .select('*')
      .order('title', { ascending: true });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    const { data: outcomes, error } = await query;
    
    if (error) {
      console.error('Error fetching learning outcomes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch learning outcomes', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ outcomes }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/outcomes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/outcomes
 * Create new learning outcome (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get the current user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is platform admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is platform admin
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

    if (!outcome_text || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: outcome_text, category' },
        { status: 400 }
      );
    }

    // Create learning outcome
    const outcomeData: LearningOutcomeInsert = {
      outcome_text,
      category,
    };
    
    const { data: outcome, error: createError } = await supabase
      .from('learning_outcomes')
      .insert(outcomeData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating learning outcome:', createError);
      return NextResponse.json(
        { error: 'Failed to create learning outcome', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ outcome }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/outcomes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

