/**
 * API Route: Submit Scholarship Application
 * POST /api/learning/scholarships/apply
 * Submits a new scholarship application for review
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyAuthenticated } from '@/app/api/learning/_helpers/auth';
import { validateBody } from '@/lib/validation/validate';
import { scholarshipApplicationSchema } from '@/lib/validation/schemas';
import { createErrorResponse, createSuccessResponse, createValidationError, createConflictError, createNotFoundError, handleSupabaseError } from '@/lib/utils/error-response';

export async function POST(request: NextRequest) {
  try {
    // Verify authenticated user
    const authResult = await verifyAuthenticated(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }

    // Validate request body
    const validation = await validateBody(request, scholarshipApplicationSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { content_type, content_id, employment_status, reason_for_scholarship, career_goals, additional_info } = validation.data;
    const supabase = createAdminClient();
    const userId = authResult.user!.id;

    // Check for existing pending application
    const { data: existingApplication } = await supabase
      .from('scholarship_applications')
      .select('id, status')
      .eq('user_id', userId)
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingApplication) {
      return createConflictError('You already have a pending application for this content');
    }

    // Find an active scholarship for this content
    const { data: scholarshipContent, error: scholarshipError } = await supabase
      .from('scholarship_content')
      .select('scholarship_id, scholarships(id, name, type, discount_percentage, is_active, valid_from, valid_until, slots_remaining)')
      .eq('content_type', content_type)
      .eq('content_id', content_id)
      .limit(1)
      .maybeSingle();

    if (scholarshipError || !scholarshipContent) {
      return createNotFoundError('Scholarship');
    }

    const scholarship = scholarshipContent.scholarships;
    if (!scholarship || !scholarship.is_active) {
      return createValidationError('No active scholarships available for this content');
    }

    // Check scholarship validity
    const now = new Date();
    if (scholarship.valid_from && new Date(scholarship.valid_from) > now) {
      return createValidationError('This scholarship is not yet available');
    }
    if (scholarship.valid_until && new Date(scholarship.valid_until) < now) {
      return createValidationError('This scholarship has expired');
    }
    if (scholarship.slots_remaining !== null && scholarship.slots_remaining <= 0) {
      return createValidationError('This scholarship has no remaining slots');
    }

    // Create application data object
    const applicationData = {
      employment_status,
      reason_for_scholarship,
      career_goals,
      ...(additional_info && { additional_info }),
    };

    // Insert scholarship application
    const { data: application, error: insertError } = await supabase
      .from('scholarship_applications')
      .insert({
        user_id: userId,
        scholarship_id: scholarship.id,
        content_type,
        content_id,
        status: 'pending',
        application_data: applicationData,
        applied_at: new Date().toISOString(),
      })
      .select('*, scholarships(id, name, type, discount_percentage)')
      .single();

    if (insertError) {
      return handleSupabaseError(insertError, 'scholarship-apply - create application');
    }

    // TODO: Send email notification to user (application received)
    // TODO: Send email notification to admin (new application to review)

    return createSuccessResponse(
      {
        application,
        message: 'Your scholarship application has been submitted successfully. We will review it within 5-7 business days.',
      },
      201
    );

  } catch (error) {
    return createErrorResponse(error, 'scholarship-apply');
  }
}

