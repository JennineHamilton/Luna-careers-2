/**
 * API Route: Credit Transaction History
 * GET /api/learning/credits/history - Get user's credit transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/learning/credits/history
 * Get user's credit transaction history
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const transaction_type = searchParams.get('transaction_type');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.account_type === 'platformAdmin';
    const targetUserId = isAdmin && user_id ? user_id : user.id;
    
    // Get transaction history
    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (transaction_type) {
      query = query.eq('transaction_type', transaction_type);
    }
    
    const { data: transactions, error } = await query;
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ transactions }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/credits/history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

