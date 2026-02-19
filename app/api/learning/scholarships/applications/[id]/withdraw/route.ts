/**
 * API Route: Withdraw Scholarship Application
 * POST /api/learning/scholarships/applications/[id]/withdraw
 * 
 * Allows users to withdraw their pending scholarship application
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '@/app/api/learning/_helpers/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id: applicationId } = await params;

    // Verify authentication
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized || !authResult.user) {
      return authResult.error || NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from('scholarship_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', authResult.user.id) // Ensure user owns this application
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if application is pending
    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending applications can be withdrawn' },
        { status: 400 }
      );
    }

    // Update application status to withdrawn
    const { error: updateError } = await supabase
      .from('scholarship_applications')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error withdrawing application:', updateError);
      return NextResponse.json(
        { error: 'Failed to withdraw application', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully',
    });

  } catch (error) {
    console.error('Error in withdraw application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

