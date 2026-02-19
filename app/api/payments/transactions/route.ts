/**
 * API Route: Payment Transactions
 * GET /api/payments/transactions - Get all payment transactions (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyPlatformAdmin } from '@/app/api/learning/_helpers/auth';

/**
 * GET /api/payments/transactions
 * Get all payment transactions with filters (platform admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify platform admin
    const authResult = await verifyPlatformAdmin(request);
    if (!authResult.authorized) {
      return authResult.error!;
    }
    
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('payment_method');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Build query
    let query = supabase
      .from('purchases')
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .order('purchased_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Apply filters
    if (status) {
      query = query.eq('payment_status', status);
    }
    
    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }
    
    const { data: transactions, error, count } = await query;
    
    if (error) {
      console.error('Error fetching payment transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment transactions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      transactions,
      total: count,
      limit,
      offset
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/payments/transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

