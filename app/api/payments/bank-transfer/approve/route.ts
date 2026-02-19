/**
 * API Route: Approve/Reject Bank Transfer
 * POST /api/payments/bank-transfer/approve - Admin approves or rejects bank transfer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

/**
 * POST /api/payments/bank-transfer/approve
 * Approve or reject a bank transfer submission
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    // Use admin client for data operations to bypass RLS
    const supabase = createAdminClient();
    const adminId = auth.user.id;
    const body = await request.json();
    
    const {
      submission_id,
      action, // 'approve' or 'reject'
      admin_notes,
    } = body;
    
    // Validate required fields
    if (!submission_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    
    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('bank_transfer_submissions')
      .select('*, purchases(*)')
      .eq('id', submission_id)
      .single();
    
    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Bank transfer submission not found' },
        { status: 404 }
      );
    }
    
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'This submission has already been processed' },
        { status: 400 }
      );
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    
    // Update submission status
    const { error: updateError } = await supabase
      .from('bank_transfer_submissions')
      .update({
        status: newStatus,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes,
      })
      .eq('id', submission_id);
    
    if (updateError) {
      console.error('Error updating submission:', updateError);
      return NextResponse.json(
        { error: 'Failed to update submission' },
        { status: 500 }
      );
    }
    
    if (action === 'approve') {
      // Update purchase status to completed
      const updateData: any = {
        payment_status: 'completed',
      };
      if (submission.transaction_reference) {
        updateData.payment_reference = submission.transaction_reference;
      }

      const { error: purchaseError } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', submission.purchase_id!);
      
      if (purchaseError) {
        console.error('Error updating purchase:', purchaseError);
        return NextResponse.json(
          { error: 'Failed to update purchase' },
          { status: 500 }
        );
      }
      
      // Deduct credits if hybrid payment
      if (submission.purchases && submission.purchases.amount_credits && submission.purchases.amount_credits > 0) {
        const { error: creditError } = await supabase.rpc('spend_credits', {
          p_user_id: submission.user_id!,
          p_amount: submission.purchases.amount_credits,
          p_source_type: 'purchase',
          p_source_id: submission.purchase_id!,
          p_description: `Payment for ${submission.enrollment_type}`,
        } as any);

        if (creditError) {
          console.error('Error deducting credits:', creditError);
          // Don't fail the whole operation, but log it
        }
      }
      
      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: submission.user_id,
          enrollment_type: submission.enrollment_type,
          enrollment_id: submission.enrollment_id,
          purchase_id: submission.purchase_id,
          status: 'active',
        });
      
      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        return NextResponse.json(
          { error: 'Failed to create enrollment' },
          { status: 500 }
        );
      }
      
      // Send notification to user about approval
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', submission.user_id)
        .single();

      if (userData) {
        // In-app notification
        await supabase.from('notifications').insert({
          user_id: submission.user_id,
          type: 'payment_approved',
          title: 'Payment Approved',
          message: `Your bank transfer of $${submission.amount_paid} has been approved. You are now enrolled!`,
          action_url: '/u/learning',
          action_label: 'Go to Learning',
          metadata: { submission_id, enrollment_type: submission.enrollment_type, enrollment_id: submission.enrollment_id },
        });

        // Email notification
        const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'there';
        sendEmail({
          to: userData.email,
          subject: 'Payment Approved - Luna Careers',
          html: `<p>Hi ${name},</p><p>Your bank transfer payment of <strong>$${submission.amount_paid}</strong> has been approved.</p><p>You are now enrolled and can start learning right away!</p><p>Best regards,<br>Luna Careers Team</p>`,
          text: `Hi ${name}, Your bank transfer payment of $${submission.amount_paid} has been approved. You are now enrolled and can start learning right away!`,
        }).catch(err => console.error('Failed to send approval email:', err));
      }
    } else {
      // Update purchase status to failed
      const updateData: any = {
        payment_status: 'failed',
      };
      if (admin_notes) {
        updateData.payment_notes = admin_notes;
      }

      const { error: purchaseError } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', submission.purchase_id!);
      
      if (purchaseError) {
        console.error('Error updating purchase:', purchaseError);
      }
      
      // Send notification to user about rejection
      const { data: userData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', submission.user_id)
        .single();

      if (userData) {
        // In-app notification
        await supabase.from('notifications').insert({
          user_id: submission.user_id,
          type: 'payment_rejected',
          title: 'Payment Not Approved',
          message: `Your bank transfer of $${submission.amount_paid} could not be verified.${admin_notes ? ` Reason: ${admin_notes}` : ''} Please contact support for assistance.`,
          action_url: '/u/learning',
          action_label: 'View Learning',
          metadata: { submission_id, enrollment_type: submission.enrollment_type, enrollment_id: submission.enrollment_id },
        });

        // Email notification
        const name = [userData.first_name, userData.last_name].filter(Boolean).join(' ') || 'there';
        sendEmail({
          to: userData.email,
          subject: 'Payment Update - Luna Careers',
          html: `<p>Hi ${name},</p><p>Unfortunately, your bank transfer payment of <strong>$${submission.amount_paid}</strong> could not be verified.</p>${admin_notes ? `<p><strong>Reason:</strong> ${admin_notes}</p>` : ''}<p>Please contact our support team if you have questions.</p><p>Best regards,<br>Luna Careers Team</p>`,
          text: `Hi ${name}, Unfortunately your bank transfer payment of $${submission.amount_paid} could not be verified.${admin_notes ? ` Reason: ${admin_notes}` : ''} Please contact our support team if you have questions.`,
        }).catch(err => console.error('Failed to send rejection email:', err));
      }
    }
    
    return NextResponse.json({
      message: `Bank transfer ${action}d successfully`,
      status: newStatus
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/payments/bank-transfer/approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

