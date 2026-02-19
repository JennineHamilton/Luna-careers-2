/**
 * API Route: Update User
 * PATCH /api/admin/users/update
 * 
 * Updates user information (platform admin only)
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
        { error: 'Forbidden: Only platform admins can update users' },
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
      phone,
      bio,
      location,
    } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        first_name,
        last_name,
        email,
        user_role,
        phone,
        bio,
        location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating user:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user', details: updateError.message },
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
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

