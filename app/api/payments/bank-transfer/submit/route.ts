/**
 * API Route: Submit Bank Transfer
 * POST /api/payments/bank-transfer/submit - User submits bank transfer proof
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { bankTransferSubmitSchema } from '@/lib/validation/schemas';

/**
 * POST /api/payments/bank-transfer/submit
 * Submit bank transfer payment proof
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Validate request body
    const validation = await validateBody(request, bankTransferSubmitSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      enrollment_type,
      enrollment_id,
      user_bank_name,
      user_account_holder,
      transaction_reference,
      amount_paid,
      receipt_image_url,
      amount_credits = 0,
    } = validation.data;
    
    // Get content details to create purchase record
    let contentQuery;
    if (enrollment_type === 'module') {
      contentQuery = supabase.from('modules').select('*').eq('id', enrollment_id).single();
    } else if (enrollment_type === 'course') {
      contentQuery = supabase.from('courses').select('*').eq('id', enrollment_id).single();
    } else if (enrollment_type === 'program') {
      contentQuery = supabase.from('programs').select('*').eq('id', enrollment_id).single();
    } else {
      return NextResponse.json(
        { error: 'Invalid enrollment type' },
        { status: 400 }
      );
    }
    
    const { data: content, error: contentError } = await contentQuery;
    
    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }
    
    // Create pending purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        purchasable_type: enrollment_type,
        purchasable_id: enrollment_id,
        original_price: content.price || 0,
        final_price: content.price || 0,
        amount_credits: amount_credits,
        amount_cash: amount_paid,
        payment_method: amount_credits > 0 ? 'hybrid' : 'bank_transfer',
        payment_status: 'pending',
        currency: 'USD',
      })
      .select()
      .single();
    
    if (purchaseError || !purchase) {
      console.error('Error creating purchase:', purchaseError);
      return NextResponse.json(
        { error: 'Failed to create purchase record' },
        { status: 500 }
      );
    }
    
    // Create bank transfer submission
    const { data: submission, error: submissionError } = await supabase
      .from('bank_transfer_submissions')
      .insert({
        purchase_id: purchase.id,
        user_id: userId,
        enrollment_type,
        enrollment_id,
        user_bank_name,
        user_account_holder,
        transaction_reference,
        amount_paid,
        receipt_image_url,
        status: 'pending',
      })
      .select()
      .single();
    
    if (submissionError) {
      console.error('Error creating bank transfer submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to submit bank transfer' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Bank transfer submitted successfully',
      submission,
      purchase
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/payments/bank-transfer/submit:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

