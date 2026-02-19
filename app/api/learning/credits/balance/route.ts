/**
 * API Route: Credit Balance
 * GET /api/learning/credits/balance - Get user's credit balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/learning/credits/balance
 * Get user's credit balance
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

    // Check if user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.account_type === 'platformAdmin';
    const targetUserId = isAdmin && user_id ? user_id : user.id;
    
    // Get credit wallet
    const { data: wallet, error } = await supabase
      .from('credit_wallets')
      .select('balance, lifetime_earned, lifetime_spent')
      .eq('user_id', targetUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Wallet doesn't exist, create one with welcome bonus
        const welcomeBonus = 100; // Starting credits for new users

        const { data: newWallet, error: createError } = await supabase
          .from('credit_wallets')
          .insert({
            user_id: targetUserId,
            balance: welcomeBonus,
            lifetime_earned: welcomeBonus,
            lifetime_spent: 0
          })
          .select('balance, lifetime_earned, lifetime_spent')
          .single();

        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create wallet', details: createError.message },
            { status: 500 }
          );
        }

        // Create initial transaction record for the welcome bonus
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: targetUserId,
            amount: welcomeBonus,
            transaction_type: 'earn',
            balance_after: welcomeBonus,
            description: 'Welcome bonus - Starting credits',
            source_type: 'system',
            source_id: targetUserId,
          });

        return NextResponse.json({ wallet: newWallet }, { status: 200 });
      }

      return NextResponse.json(
        { error: 'Failed to fetch wallet', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ wallet }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/credits/balance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

