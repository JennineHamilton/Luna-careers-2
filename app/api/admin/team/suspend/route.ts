/**
 * API Route: Suspend/Unsuspend Team Member
 * POST /api/admin/team/suspend
 * 
 * Suspends or unsuspends a platform admin team member (platform admin only)
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
    const userRole = user.user_metadata?.user_role;
    
    if (accountType !== 'platformAdmin' || userRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only super admins can suspend team members' },
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
        { error: 'reason is required when suspending a team member' },
        { status: 400 }
      );
    }
    
    // Prevent self-suspension
    if (user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot suspend yourself' },
        { status: 400 }
      );
    }
    
    // Verify user is a platform admin team member
    const { data: existingUser } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user_id)
      .single();

    if (existingUser?.account_type !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'User is not a platform admin team member' },
        { status: 400 }
      );
    }

    // Update team member suspension status
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
      console.error('Error updating team member suspension:', updateError);
      return NextResponse.json(
        { error: 'Failed to update team member suspension', details: updateError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: suspend ? 'Team member suspended successfully' : 'Team member unsuspended successfully',
    });
  } catch (error) {
    console.error('Suspend team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

