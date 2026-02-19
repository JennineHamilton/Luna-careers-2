/**
 * API Route: Individual Skill Operations
 * GET /api/learning/skills/[id] - Get single skill
 * PATCH /api/learning/skills/[id] - Update skill (admin only)
 * DELETE /api/learning/skills/[id] - Delete skill (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type SkillUpdate = Database['public']['Tables']['skills']['Update'];

/**
 * GET /api/learning/skills/[id]
 * Get single skill by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: skill, error } = await supabase
      .from('skills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Skill not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch skill', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ skill }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/skills/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/skills/[id]
 * Update skill (platform admin only)
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
    const { name, category, description } = body;
    
    const updateData: SkillUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (description !== undefined) updateData.description = description;
    
    const { data: skill, error: updateError } = await supabase
      .from('skills')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating skill:', updateError);
      return NextResponse.json(
        { error: 'Failed to update skill', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ skill }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/skills/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/skills/[id]
 * Delete skill (platform admin only)
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
      .from('skills')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting skill:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete skill', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/skills/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

