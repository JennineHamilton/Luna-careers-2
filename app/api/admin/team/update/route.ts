/**
 * API Route: Update Team Member
 * PATCH /api/admin/team/update
 * 
 * Updates team member information (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(request: NextRequest) {
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
        { error: 'Forbidden: Only platform admins can update team members' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const {
      user_id,
      first_name,
      last_name,
      email,
      user_role,
    } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
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

    // Update team member in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        email,
        user_role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating team member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update team member', details: updateError.message },
        { status: 500 }
      );
    }
    
    // Update auth user metadata
    await supabase.auth.admin.updateUserById(user_id, {
      email,
      user_metadata: {
        first_name,
        last_name,
        user_role,
      },
    });
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

