/**
 * API Route: Check Scholarship Eligibility
 * GET /api/learning/scholarships/eligibility?content_type=X&content_id=Y
 * Checks if user is eligible to apply for scholarship or has existing application/award
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '@/app/api/learning/_helpers/auth';
import type { ScholarshipEligibilityResponse } from '@/types/scholarship';

export async function GET(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    const supabase = createAdminClient();
    const searchParams = request.nextUrl.searchParams;
    const content_type = searchParams.get('content_type');
    const content_id = searchParams.get('content_id');

    if (!content_type || !content_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: content_type, content_id' },
        { status: 400 }
      );
    }

    const userId = authResult.user!.id;

    // Check for existing scholarship application
    const { data: existingApplication, error: appError } = await supabase
      .from('scholarship_applications')
      .select('*, scholarships(id, name, type, discount_percentage)')
      .eq('user_id', userId)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .order('applied_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appError) {
      console.error('Error checking existing application:', appError);
      return NextResponse.json(
        { error: 'Failed to check eligibility', details: appError.message },
        { status: 500 }
      );
    }

    // If there's a pending application, user cannot apply again
    if (existingApplication && existingApplication.status === 'pending') {
      const response: ScholarshipEligibilityResponse = {
        eligible: false,
        reason: 'You have a pending scholarship application for this content',
        existing_application: existingApplication,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Check for awarded scholarship
    const { data: awardedScholarship, error: awardError } = await supabase
      .from('awarded_scholarships')
      .select('*, scholarships(id, name, type, discount_percentage)')
      .eq('user_id', userId)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .eq('used', false)
      .maybeSingle();

    if (awardError) {
      console.error('Error checking awarded scholarship:', awardError);
      return NextResponse.json(
        { error: 'Failed to check eligibility', details: awardError.message },
        { status: 500 }
      );
    }

    // If user has an awarded scholarship, they can enroll directly
    if (awardedScholarship) {
      // Check if it's expired
      if (awardedScholarship.expires_at) {
        const expirationDate = new Date(awardedScholarship.expires_at);
        const now = new Date();
        
        if (expirationDate < now) {
          const response: ScholarshipEligibilityResponse = {
            eligible: true,
            reason: 'Your previous scholarship has expired. You can apply again.',
            existing_application: existingApplication || undefined,
          };
          return NextResponse.json(response, { status: 200 });
        }
      }

      const response: ScholarshipEligibilityResponse = {
        eligible: false,
        reason: 'You have an approved scholarship for this content. You can enroll now!',
        awarded_scholarship: awardedScholarship,
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Check if there are available scholarships for this content
    const { data: availableScholarships, error: scholarshipError } = await supabase
      .from('scholarship_content')
      .select('scholarship_id, scholarships(id, name, type, is_active, valid_from, valid_until, slots_remaining)')
      .eq('content_type', content_type)
      .eq('content_id', content_id);

    if (scholarshipError) {
      console.error('Error checking available scholarships:', scholarshipError);
      return NextResponse.json(
        { error: 'Failed to check eligibility', details: scholarshipError.message },
        { status: 500 }
      );
    }

    if (!availableScholarships || availableScholarships.length === 0) {
      const response: ScholarshipEligibilityResponse = {
        eligible: false,
        reason: 'No scholarships are currently available for this content',
      };
      return NextResponse.json(response, { status: 200 });
    }

    // Filter active scholarships
    const now = new Date();
    const activeScholarships = availableScholarships.filter((sc) => {
      const scholarship = sc.scholarships;
      if (!scholarship || !scholarship.is_active) return false;
      
      if (scholarship.valid_from && new Date(scholarship.valid_from) > now) return false;
      if (scholarship.valid_until && new Date(scholarship.valid_until) < now) return false;
      if (scholarship.slots_remaining !== null && scholarship.slots_remaining <= 0) return false;
      
      return true;
    });

    if (activeScholarships.length === 0) {
      const response: ScholarshipEligibilityResponse = {
        eligible: false,
        reason: 'No active scholarships are currently available for this content',
      };
      return NextResponse.json(response, { status: 200 });
    }

    // User is eligible to apply
    const response: ScholarshipEligibilityResponse = {
      eligible: true,
      existing_application: existingApplication || undefined,
    };
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error in scholarship eligibility check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

