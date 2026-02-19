/**
 * API Route: Pending Bank Transfers
 * GET /api/payments/bank-transfer/pending - Get all pending bank transfer submissions (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

/**
 * GET /api/payments/bank-transfer/pending
 * Get all pending bank transfer submissions (platform admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    // Use admin client for data fetching to bypass RLS
    const adminSupabase = createAdminClient();

    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch bank transfer submissions without joins to avoid RLS recursion
    let query = adminSupabase
      .from('bank_transfer_submissions')
      .select('*', { count: 'exact' });

    // Only filter by status if not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: submissions, error, count } = await query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] Error fetching bank transfers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bank transfers', details: error.message },
        { status: 500 }
      );
    }

    // Fetch related data separately to avoid RLS recursion
    if (submissions && submissions.length > 0) {
      const userIds = [...new Set(submissions.map(s => s.user_id))];
      const purchaseIds = submissions.map(s => s.purchase_id).filter((id): id is string => id !== null);

      // Fetch users using admin client to bypass RLS
      const { data: users, error: usersError } = await adminSupabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users for bank transfers:', usersError);
      }

      // Fetch purchases using admin client to bypass RLS
      const { data: purchases, error: purchasesError } = await adminSupabase
        .from('purchases')
        .select('id, purchasable_type, purchasable_id, original_price, final_price, amount_credits, amount_cash, payment_method, payment_status')
        .in('id', purchaseIds);

      if (purchasesError) {
        console.error('Error fetching purchases for bank transfers:', purchasesError);
      }

      // Map users and purchases to submissions
      const enrichedSubmissions = submissions.map(submission => ({
        ...submission,
        user: users?.find(u => u.id === submission.user_id) || null,
        purchase: purchases?.find(p => p.id === submission.purchase_id) || null,
      }));

      return NextResponse.json({
        submissions: enrichedSubmissions,
        total: count,
        limit,
        offset
      }, { status: 200 });
    }

    return NextResponse.json({
      submissions: [],
      total: count || 0,
      limit,
      offset
    }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/payments/bank-transfer/pending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

