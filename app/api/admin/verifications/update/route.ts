/**
 * API Route: Update Verification Status
 * PATCH /api/admin/verifications/update
 * 
 * Updates verification status for professional credentials (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import { validateBody } from '@/lib/validation/validate';
import { verificationUpdateSchema } from '@/lib/validation/schemas';

type VerificationType = 'experience' | 'education' | 'certification';
type VerificationAction = 'approve' | 'reject';

const TABLE_MAP: Record<VerificationType, string> = {
  experience: 'professional_experience',
  education: 'education',
  certification: 'certifications',
};

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Validate request body
    const validation = await validateBody(request, verificationUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const { id, type, action, rejection_reason } = validation.data;

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'rejection_reason is required when rejecting' },
        { status: 400 }
      );
    }

    // Use admin client to update (bypasses RLS)
    const adminClient = createAdminClient();
    const newStatus = action === 'approve' ? 'verified' : 'rejected';

    // Prepare update data
    const updateData: any = {
      verification_status: newStatus,
      verified_by: user.id,
      verified_at: new Date().toISOString(),
    };

    if (action === 'reject') {
      updateData.rejection_reason = rejection_reason;
    }

    // Update the record based on type (type-safe approach)
    let updatedRecord: any;
    let updateError: any;

    if (type === 'experience') {
      const result = await adminClient
        .from('professional_experience')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      updatedRecord = result.data;
      updateError = result.error;
    } else if (type === 'education') {
      const result = await adminClient
        .from('education')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      updatedRecord = result.data;
      updateError = result.error;
    } else if (type === 'certification') {
      const result = await adminClient
        .from('certifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      updatedRecord = result.data;
      updateError = result.error;
    }

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification', details: updateError.message },
        { status: 500 }
      );
    }

    // TODO: Send notification to user about verification status change
    // This can be implemented later using the notifications system

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: `Verification ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Update verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

