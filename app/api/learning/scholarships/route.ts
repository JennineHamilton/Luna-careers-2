/**
 * API Route: Scholarships Management
 * GET /api/learning/scholarships - List all scholarships
 * POST /api/learning/scholarships - Create new scholarship (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../_helpers/auth';
import { validateBody } from '@/lib/validation/validate';
import { scholarshipCreateSchema } from '@/lib/validation/schemas';
import type { Database } from '@/types/database.types';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];
type ScholarshipInsert = Database['public']['Tables']['scholarships']['Insert'];

/**
 * GET /api/learning/scholarships
 * List all scholarships (public can see active, admin can see all)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const active_only = searchParams.get('active_only') !== 'false';
    
    let query = supabase
      .from('scholarships')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (active_only) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: scholarships, error } = await query;
    
    if (error) {
      console.error('Error fetching scholarships:', error);
      return NextResponse.json(
        { error: 'Failed to fetch scholarships', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ scholarships }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/scholarships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/scholarships
 * Create new scholarship (platform admin only)
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
    const validation = await validateBody(request, scholarshipCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      name,
      description,
      type,
      discount_percentage,
      total_slots,
      valid_from,
      valid_until,
      eligibility_criteria,
      is_active
    } = validation.data;

    // Create scholarship
    const scholarshipData: ScholarshipInsert = {
      name,
      description,
      type,
      discount_percentage,
      total_slots: total_slots || null,
      slots_remaining: total_slots || null, // Initialize slots_remaining to total_slots
      valid_from: valid_from || null,
      valid_until: valid_until || null,
      eligibility_criteria: eligibility_criteria || null,
      is_active: is_active !== undefined ? is_active : true,
    };
    
    const { data: scholarship, error: createError } = await supabase
      .from('scholarships')
      .insert(scholarshipData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating scholarship:', createError);
      return NextResponse.json(
        { error: 'Failed to create scholarship', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ scholarship }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/scholarships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

