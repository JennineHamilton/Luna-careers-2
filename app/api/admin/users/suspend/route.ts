/**
 * API Route: Suspend/Unsuspend User
 * POST /api/admin/users/suspend
 * 
 * Suspends or unsuspends a user account (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Get the current user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is platform admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const accountType = user.user_metadata?.account_type;
    if (accountType !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'Forbidden: Only platform admins can suspend users' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { user_id, suspend, reason } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    if (suspend && !reason) {
      return NextResponse.json(
        { error: 'reason is required when suspending a user' },
        { status: 400 }
      );
    }
    
    // Update user suspension status in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_suspended: suspend,
        suspension_reason: suspend ? reason : null,
        suspended_at: suspend ? new Date().toISOString() : null,
        suspended_by: suspend ? user.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user suspension:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user suspension', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Ban/unban user in auth
    if (suspend) {
      await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: 'none', // Indefinite ban
      });
    } else {
      await supabase.auth.admin.updateUserById(user_id, {
        ban_duration: '0s', // Remove ban
      });
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: suspend ? 'User suspended successfully' : 'User unsuspended successfully',
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

