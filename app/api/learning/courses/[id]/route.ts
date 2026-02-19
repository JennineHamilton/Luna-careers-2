/**
 * API Route: Individual Course Operations
 * GET /api/learning/courses/[id] - Get single course with modules
 * PATCH /api/learning/courses/[id] - Update course (admin only)
 * DELETE /api/learning/courses/[id] - Delete course (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type CourseUpdate = Database['public']['Tables']['courses']['Update'];

/**
 * GET /api/learning/courses/[id]
 * Get single course by ID with modules
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    // Get course with creator
    const { data: course, error } = await supabase
      .from('courses')
      .select('*, creators(id, name, logo_url)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch course', details: error.message },
        { status: 500 }
      );
    }
    
    // Get course modules
    const { data: courseModules, error: modulesError } = await supabase
      .from('course_modules')
      .select('*, modules(id, title, duration_minutes, level)')
      .eq('course_id', id)
      .order('sort_order', { ascending: true });
    
    if (modulesError) {
      console.error('Error fetching course modules:', modulesError);
    }
    
    // Get prerequisites
    const { data: prerequisites, error: prereqError } = await supabase
      .from('course_prerequisites')
      .select('*, prerequisite:courses!course_prerequisites_prerequisite_course_id_fkey(id, title)')
      .eq('course_id', id);
    
    if (prereqError) {
      console.error('Error fetching prerequisites:', prereqError);
    }
    
    return NextResponse.json({ 
      course: {
        ...course,
        modules: courseModules || [],
        prerequisites: prerequisites || []
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/courses/[id]
 * Update course (platform admin only)
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

    const updateData: CourseUpdate = {};
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
    
    const { data: course, error: updateError } = await supabase
      .from('courses')
      .update(updateData)
      .eq('id', id)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json(
        { error: 'Failed to update course', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ course }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/courses/[id]
 * Delete course (platform admin only)
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
      .from('courses')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete course', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/courses/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

