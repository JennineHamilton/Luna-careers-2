/**
 * API Route: Skills Management
 * GET /api/learning/skills - List all skills
 * POST /api/learning/skills - Create new skill (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];
type SkillInsert = Database['public']['Tables']['skills']['Insert'];

/**
 * GET /api/learning/skills
 * List all skills (public access)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    
    let query = supabase
      .from('skills')
      .select('*')
      .order('name', { ascending: true });
    
    // Apply filters
    if (category) {
      query = query.eq('category', category as any);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: skills, error } = await query;
    
    if (error) {
      console.error('Error fetching skills:', error);
      return NextResponse.json(
        { error: 'Failed to fetch skills', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ skills }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/skills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/skills
 * Create new skill (platform admin only)
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
    const { name, category, description } = body;
    
    if (!name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, category' },
        { status: 400 }
      );
    }
    
    // Create skill
    const skillData: SkillInsert = {
      name,
      category,
      description: description || null,
    };
    
    const { data: skill, error: createError } = await supabase
      .from('skills')
      .insert(skillData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating skill:', createError);
      return NextResponse.json(
        { error: 'Failed to create skill', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ skill }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/skills:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

