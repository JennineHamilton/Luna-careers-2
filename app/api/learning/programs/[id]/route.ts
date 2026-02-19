/**
 * API Route: Individual Program Operations
 * GET /api/learning/programs/[id] - Get single program with courses
 * PATCH /api/learning/programs/[id] - Update program (admin only)
 * DELETE /api/learning/programs/[id] - Delete program (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type ProgramUpdate = Database['public']['Tables']['programs']['Update'];

/**
 * GET /api/learning/programs/[id]
 * Get single program by ID with courses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Get program with creator
    const { data: program, error } = await supabase
      .from('programs')
      .select('*, creators(id, name, logo_url)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Program not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch program', details: error.message },
        { status: 500 }
      );
    }
    
    // Get program courses
    const { data: programCourses, error: coursesError } = await supabase
      .from('program_courses')
      .select('*, courses(id, title, duration_minutes, level)')
      .eq('program_id', id)
      .order('sort_order', { ascending: true });
    
    if (coursesError) {
      console.error('Error fetching program courses:', coursesError);
    }
    
    return NextResponse.json({ 
      program: {
        ...program,
        courses: programCourses || []
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/programs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/programs/[id]
 * Update program (platform admin only)
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

    const updateData: ProgramUpdate = {};
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
    
    const { data: program, error: updateError } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (updateError) {
      console.error('Error updating program:', updateError);
      return NextResponse.json(
        { error: 'Failed to update program', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ program }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/programs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/programs/[id]
 * Delete program (platform admin only)
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
      .from('programs')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting program:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete program', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/programs/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

