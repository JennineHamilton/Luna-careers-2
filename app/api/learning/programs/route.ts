/**
 * API Route: Programs Management
 * GET /api/learning/programs - List all programs
 * POST /api/learning/programs - Create new program (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../_helpers/auth';
import type { Database } from '@/types/database.types';
import { validateBody } from '@/lib/validation/validate';
import { programCreateSchema } from '@/lib/validation/schemas';

type Program = Database['public']['Tables']['programs']['Row'];
type ProgramInsert = Database['public']['Tables']['programs']['Insert'];

/**
 * GET /api/learning/programs
 * List all programs (public can see published, admin can see all)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const creator_id = searchParams.get('creator_id');
    const is_free = searchParams.get('is_free');
    const search = searchParams.get('search');
    const published_only = searchParams.get('published_only') !== 'false';
    
    let query = supabase
      .from('programs')
      .select('*, creators(id, name, logo_url)')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (published_only) {
      query = query.eq('is_published', true);
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
    
    const { data: programs, error } = await query;
    
    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch programs', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ programs }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/programs
 * Create new program (platform admin only)
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
    const validation = await validateBody(request, programCreateSchema);
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

    // Create program
    const programData: ProgramInsert = {
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
    
    const { data: program, error: createError } = await supabase
      .from('programs')
      .insert(programData)
      .select('*, creators(id, name, logo_url)')
      .single();
    
    if (createError) {
      console.error('Error creating program:', createError);
      return NextResponse.json(
        { error: 'Failed to create program', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ program }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/programs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

