/**
 * API Route: Lessons Management
 * GET /api/learning/lessons - List all lessons
 * POST /api/learning/lessons - Create new lesson (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../_helpers/auth';
import type { Database } from '@/types/database.types';
import { validateBody } from '@/lib/validation/validate';
import { lessonCreateSchema } from '@/lib/validation/schemas';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type LessonInsert = Database['public']['Tables']['lessons']['Insert'];

/**
 * GET /api/learning/lessons
 * List all lessons (public can see published, admin can see all)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const creator_id = searchParams.get('creator_id');
    const search = searchParams.get('search');
    const published_only = searchParams.get('published_only') !== 'false'; // Default to true

    let query = supabase
      .from('lessons')
      .select('*, creators(id, name, logo_url)')
      .order('created_at', { ascending: false });

    // Apply filters
    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    const { data: lessons, error } = await query;
    
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lessons }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/lessons
 * Create new lesson (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      console.error('[POST /api/learning/lessons] Auth failed:', authResult.error);
      return authResult.error!;
    }

    const supabase = createAdminClient();

    // Validate request body
    const validation = await validateBody(request, lessonCreateSchema);
    if (!validation.success) {
      console.error('[POST /api/learning/lessons] Validation failed:', validation.error);
      return validation.error;
    }

    const {
      title,
      description,
      scorm_package_url,
      scorm_version,
      duration_minutes,
      creator_id,
    } = validation.data;

    // Create lesson
    const lessonData: LessonInsert = {
      title,
      description: description || null,
      scorm_package_url,
      scorm_version,
      duration_minutes,
      creator_id: creator_id || null,
    };
    
    const { data: lesson, error: createError } = await supabase
      .from('lessons')
      .insert(lessonData)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (createError) {
      console.error('Error creating lesson:', createError);
      return NextResponse.json(
        { error: 'Failed to create lesson', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ lesson }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

