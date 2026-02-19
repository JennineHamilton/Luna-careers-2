/**
 * API Route: Individual Module Operations
 * GET /api/learning/modules/[id] - Get single module with lessons
 * PATCH /api/learning/modules/[id] - Update module (admin only)
 * DELETE /api/learning/modules/[id] - Delete module (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type ModuleUpdate = Database['public']['Tables']['modules']['Update'];

/**
 * GET /api/learning/modules/[id]
 * Get single module by ID with lessons
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Get module with creator
    const { data: module, error } = await supabase
      .from('modules')
      .select('*, creators(id, name, logo_url)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Module not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch module', details: error.message },
        { status: 500 }
      );
    }
    
    // Get module lessons
    const { data: moduleLessons, error: lessonsError } = await supabase
      .from('module_lessons')
      .select('*, lessons(id, title, duration_minutes)')
      .eq('module_id', id)
      .order('sort_order', { ascending: true });
    
    if (lessonsError) {
      console.error('Error fetching module lessons:', lessonsError);
    }
    
    // Get prerequisites
    const { data: prerequisites, error: prereqError } = await supabase
      .from('module_prerequisites')
      .select('*, prerequisite:modules!module_prerequisites_prerequisite_module_id_fkey(id, title)')
      .eq('module_id', id);
    
    if (prereqError) {
      console.error('Error fetching prerequisites:', prereqError);
    }
    
    return NextResponse.json({ 
      module: {
        ...module,
        lessons: moduleLessons || [],
        prerequisites: prerequisites || []
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/modules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/modules/[id]
 * Update module (platform admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;
    
    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      learning_outcomes,
      skills,
      level,
      price, // Changed from price_credits to price (dollars)
      is_free,
      intro_video_url,
      cover_image_url,
      creator_id,
      requirements,
      scholarship_eligible,
      scholarship_types,
      is_published
    } = body;

    const updateData: ModuleUpdate = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (learning_outcomes !== undefined) updateData.learning_outcomes = learning_outcomes;
    if (skills !== undefined) updateData.skills = skills;
    if (level !== undefined) updateData.level = level;
    if (price !== undefined) updateData.price = price; // Changed from price_credits to price (dollars)
    if (is_free !== undefined) updateData.is_free = is_free;
    if (intro_video_url !== undefined) updateData.intro_video_url = intro_video_url;
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;
    if (creator_id !== undefined) updateData.creator_id = creator_id;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (scholarship_eligible !== undefined) updateData.scholarship_eligible = scholarship_eligible;
    if (scholarship_types !== undefined) updateData.scholarship_types = scholarship_types;
    if (is_published !== undefined) updateData.is_published = is_published;
    
    const { data: module, error: updateError } = await supabase
      .from('modules')
      .update(updateData)
      .eq('id', id)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (updateError) {
      console.error('Error updating module:', updateError);
      return NextResponse.json(
        { error: 'Failed to update module', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ module }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/modules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/modules/[id]
 * Delete module (platform admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;
    
    const { error: deleteError } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting module:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete module', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/modules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

