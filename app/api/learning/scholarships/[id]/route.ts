/**
 * API Route: Individual Scholarship Operations
 * GET /api/learning/scholarships/[id] - Get single scholarship
 * PATCH /api/learning/scholarships/[id] - Update scholarship (admin only)
 * DELETE /api/learning/scholarships/[id] - Delete scholarship (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type ScholarshipUpdate = Database['public']['Tables']['scholarships']['Update'];

/**
 * GET /api/learning/scholarships/[id]
 * Get single scholarship by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: scholarship, error } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Scholarship not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch scholarship', details: error.message },
        { status: 500 }
      );
    }
    
    // Get eligible content for this scholarship
    const { data: eligibleContent, error: contentError } = await supabase
      .from('scholarship_content')
      .select('*, modules(id, title), courses(id, title), programs(id, title)')
      .eq('scholarship_id', id);
    
    if (contentError) {
      console.error('Error fetching eligible content:', contentError);
    }
    
    return NextResponse.json({ 
      scholarship: {
        ...scholarship,
        eligible_content: eligibleContent || []
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/scholarships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/scholarships/[id]
 * Update scholarship (platform admin only)
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
      name,
      description,
      type,
      discount_percentage,
      total_slots,
      slots_remaining,
      valid_from,
      valid_until,
      eligibility_criteria,
      is_active
    } = body;

    const updateData: ScholarshipUpdate = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (discount_percentage !== undefined) updateData.discount_percentage = discount_percentage;
    if (total_slots !== undefined) updateData.total_slots = total_slots;
    if (slots_remaining !== undefined) updateData.slots_remaining = slots_remaining;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_until !== undefined) updateData.valid_until = valid_until;
    if (eligibility_criteria !== undefined) updateData.eligibility_criteria = eligibility_criteria;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const { data: scholarship, error: updateError } = await supabase
      .from('scholarships')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating scholarship:', updateError);
      return NextResponse.json(
        { error: 'Failed to update scholarship', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ scholarship }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/scholarships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/learning/scholarships/[id]
 * Delete scholarship (platform admin only)
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
      .from('scholarships')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('Error deleting scholarship:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete scholarship', details: deleteError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/learning/scholarships/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

