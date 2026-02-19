/**
 * API Route: Scholarship Applications Management
 * GET /api/learning/scholarships/applications - List applications (user sees own, admin sees all)
 * POST /api/learning/scholarships/applications - Apply for scholarship (authenticated users)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '../../_helpers/auth';
import type { Database } from '@/types/database.types';

type ScholarshipApplicationInsert = Database['public']['Tables']['scholarship_applications']['Insert'];

/**
 * GET /api/learning/scholarships/applications
 * List scholarship applications
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const scholarship_id = searchParams.get('scholarship_id');
    const status = searchParams.get('status');
    
    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', authResult.user!.id)
      .single();
    
    const isAdmin = userData?.account_type === 'platformAdmin';
    
    let query = supabase
      .from('scholarship_applications')
      .select('*, scholarships(id, name, type), users(id, full_name, email)')
      .order('created_at', { ascending: false });
    
    // Non-admin users can only see their own applications
    if (!isAdmin) {
      query = query.eq('user_id', authResult.user!.id);
    }
    
    // Apply filters
    if (scholarship_id) {
      query = query.eq('scholarship_id', scholarship_id);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: applications, error } = await query;
    
    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch applications', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ applications }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/scholarships/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/scholarships/applications
 * Apply for scholarship (authenticated users)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();
    
    // Parse request body
    const body = await request.json();
    const { scholarship_id, content_type, content_id, application_data } = body;

    if (!scholarship_id || !content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: scholarship_id, content_type, content_id' },
        { status: 400 }
      );
    }
    
    // Check if scholarship exists and is active
    const { data: scholarship, error: scholarshipError } = await supabase
      .from('scholarships')
      .select('*')
      .eq('id', scholarship_id)
      .single();
    
    if (scholarshipError || !scholarship) {
      return NextResponse.json(
        { error: 'Scholarship not found' },
        { status: 404 }
      );
    }
    
    if (!scholarship.is_active) {
      return NextResponse.json(
        { error: 'Scholarship is not active' },
        { status: 400 }
      );
    }
    
    // Check if user already applied
    const { data: existingApplication } = await supabase
      .from('scholarship_applications')
      .select('id')
      .eq('scholarship_id', scholarship_id)
      .eq('user_id', authResult.user!.id)
      .single();
    
    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this scholarship' },
        { status: 400 }
      );
    }
    
    // Create application
    const applicationData: ScholarshipApplicationInsert = {
      scholarship_id,
      content_type,
      content_id,
      user_id: authResult.user!.id,
      application_data: application_data || null,
      status: 'pending',
    };
    
    const { data: application, error: createError } = await supabase
      .from('scholarship_applications')
      .insert(applicationData)
      .select('*, scholarships(id, name, type)')
      .single();
    
    if (createError) {
      console.error('Error creating application:', createError);
      return NextResponse.json(
        { error: 'Failed to create application', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ application }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/scholarships/applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

