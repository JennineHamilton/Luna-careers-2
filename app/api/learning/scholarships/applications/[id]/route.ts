/**
 * API Route: Individual Scholarship Application Operations
 * GET /api/learning/scholarships/applications/[id] - Get single application
 * PATCH /api/learning/scholarships/applications/[id] - Update application status (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated, verifyPlatformAdmin } from '../../../_helpers/auth';
import type { Database } from '@/types/database.types';

type ScholarshipApplicationUpdate = Database['public']['Tables']['scholarship_applications']['Update'];

/**
 * GET /api/learning/scholarships/applications/[id]
 * Get single application by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const { id } = await params;
    
    const { data: application, error } = await supabase
      .from('scholarship_applications')
      .select('*, scholarships(id, name, type), users(id, full_name, email)')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch application', details: error.message },
        { status: 500 }
      );
    }
    
    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', authResult.user!.id)
      .single();
    
    const isAdmin = userData?.account_type === 'platformAdmin';
    
    // Non-admin users can only see their own applications
    if (!isAdmin && application.user_id !== authResult.user!.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own applications' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ application }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/scholarships/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/learning/scholarships/applications/[id]
 * Update application status (platform admin only)
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
    const { status, review_notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    const updateData: ScholarshipApplicationUpdate = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: authResult.user!.id,
    };

    if (review_notes !== undefined) {
      updateData.review_notes = review_notes;
    }
    
    const { data: application, error: updateError } = await supabase
      .from('scholarship_applications')
      .update(updateData)
      .eq('id', id)
      .select('*, scholarships(id, name, type), users(id, full_name, email)')
      .single();
    
    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application', details: updateError.message },
        { status: 500 }
      );
    }
    
    // If approved, create awarded_scholarship record
    if (status === 'approved') {
      // Get scholarship details for discount calculation
      const { data: scholarship } = await supabase
        .from('scholarships')
        .select('discount_percentage')
        .eq('id', application.scholarship_id)
        .single();

      // Get content price (module, course, or program)
      let originalPrice = 0;
      const { data: content } = await supabase
        .from(application.content_type === 'module' ? 'modules' : application.content_type === 'course' ? 'courses' : 'programs')
        .select('price')
        .eq('id', application.content_id)
        .single();

      if (content) {
        originalPrice = content.price || 0;
      }

      const discountPercentage = scholarship?.discount_percentage || 0;
      const discountedPrice = Math.round(originalPrice * (1 - discountPercentage / 100));

      const { error: awardError } = await supabase
        .from('awarded_scholarships')
        .insert({
          application_id: application.id,
          user_id: application.user_id,
          scholarship_id: application.scholarship_id,
          content_type: application.content_type,
          content_id: application.content_id,
          discount_percentage: discountPercentage,
          original_price: originalPrice,
          discounted_price: discountedPrice,
        });

      if (awardError) {
        console.error('Error creating awarded scholarship:', awardError);
        // Don't fail the request, just log the error
      }
    }
    
    return NextResponse.json({ application }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in PATCH /api/learning/scholarships/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

