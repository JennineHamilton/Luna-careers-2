/**
 * API Route: Modules Management
 * GET /api/learning/modules - List all modules
 * POST /api/learning/modules - Create new module (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../_helpers/auth';
import type { Database } from '@/types/database.types';
import { validateBody } from '@/lib/validation/validate';
import { moduleCreateSchema } from '@/lib/validation/schemas';

type Module = Database['public']['Tables']['modules']['Row'];
type ModuleInsert = Database['public']['Tables']['modules']['Insert'];

/**
 * GET /api/learning/modules
 * List all modules (public can see published, admin can see all)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const creator_id = searchParams.get('creator_id');
    const is_free = searchParams.get('is_free');
    const search = searchParams.get('search');
    const published_only = searchParams.get('published_only') !== 'false';
    
    let query = supabase
      .from('modules')
      .select(`
        *,
        creators(id, name, logo_url),
        module_lessons(id),
        module_quizzes(quiz_id)
      `)
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (published_only) {
      query = query.eq('is_published', true);
    }
    
    if (level) {
      query = query.eq('level', level);
    }
    
    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }
    
    if (is_free !== null) {
      query = query.eq('is_free', is_free === 'true');
    }
    
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    
    const { data: modules, error } = await query;

    if (error) {
      console.error('Error fetching modules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch modules', details: error.message },
        { status: 500 }
      );
    }

    // Transform modules to include lesson and quiz counts
    const modulesWithCounts = modules?.map((module: any) => ({
      ...module,
      lesson_count: module.module_lessons?.length || 0,
      quiz_count: module.module_quizzes?.length || 0,
      // Remove the junction table data to keep response clean
      module_lessons: undefined,
      module_quizzes: undefined,
    }));

    return NextResponse.json({ modules: modulesWithCounts }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/modules
 * Create new module (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();
    
    // Validate request body
    const validation = await validateBody(request, moduleCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      title,
      description,
      learning_outcomes,
      skills,
      level,
      price,
      is_free,
      intro_video_url,
      cover_image_url,
      creator_id,
      requirements,
      scholarship_eligible,
      scholarship_types,
      is_published
    } = validation.data;

    // Create module
    const moduleData: ModuleInsert = {
      title,
      description,
      learning_outcomes: learning_outcomes || null,
      skills: skills || null,
      level,
      price: price || 0, // Changed from price_credits to price (dollars)
      is_free: is_free || false,
      intro_video_url: intro_video_url || null,
      cover_image_url: cover_image_url || null,
      creator_id: creator_id || null,
      requirements: requirements || null,
      scholarship_eligible: scholarship_eligible || false,
      scholarship_types: scholarship_types || null,
      is_published: is_published || false,
    };
    
    const { data: module, error: createError } = await supabase
      .from('modules')
      .insert(moduleData)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (createError) {
      console.error('Error creating module:', createError);
      return NextResponse.json(
        { error: 'Failed to create module', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ module }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

