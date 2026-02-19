/**
 * API Route: Individual Creator Operations
 * GET /api/learning/creators/[id] - Get single creator
 * PATCH /api/learning/creators/[id] - Update creator (admin only)
 * DELETE /api/learning/creators/[id] - Delete creator (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type CreatorUpdate = Database['public']['Tables']['creators']['Update'];

/**
 * GET /api/learning/creators/[id]
 * Get single creator by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Creator not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch creator', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ creator }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/creators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/creators/[id]
 * Update creator (platform admin only)
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
    const { name, type, bio, logo_url, website_url, verified } = body;

    const updateData: CreatorUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (bio !== undefined) updateData.bio = bio;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (website_url !== undefined) updateData.website_url = website_url;
    if (verified !== undefined) updateData.verified = verified;
    
    const { data: creator, error: updateError } = await supabase
      .from('creators')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating creator:', updateError);
      return NextResponse.json(
        { error: 'Failed to update creator', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ creator }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/creators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/creators/[id]
 * Delete creator (platform admin only)
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
      .from('creators')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting creator:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete creator', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/creators/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

