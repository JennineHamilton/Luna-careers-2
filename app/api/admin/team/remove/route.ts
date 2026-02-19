/**
 * API Route: Remove Team Member
 * DELETE /api/admin/team/remove
 * 
 * Permanently removes a platform admin team member (super admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Get the current user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is super admin
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
        { error: 'Forbidden: Only super admins can remove team members' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { user_id } = body;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    // Prevent self-removal
    if (user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove yourself' },
        { status: 400 }
      );
    }
    
    // Verify user is a platform admin team member
    const { data: existingUser } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user_id)
      .single();
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (existingUser.account_type !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'User is not a platform admin team member' },
        { status: 400 }
      );
    }
    
    // Delete user from database (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', user_id);
    
    if (deleteError) {
      console.error('Error deleting team member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete team member', details: deleteError.message },
        { status: 500 }
      );
    }
    
    // Delete auth user
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user_id);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // Continue anyway as the database record is already deleted
    }
    
    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully',
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

