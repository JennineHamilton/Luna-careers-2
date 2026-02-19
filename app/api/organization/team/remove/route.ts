/**
 * API Route: Remove Organization Team Member
 * DELETE /api/organization/team/remove
 * 
 * Disconnects a team member from the organization (organization admin only)
 * Changes account type from 'hybrid' to 'personal' without deleting the user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/api-auth';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    const supabase = createAdminClient();

    // Get user's organization_id and role
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, user_role, account_type')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'User is not part of an organization' },
        { status: 403 }
      );
    }

    // Verify user is org admin
    if (userData.user_role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only organization admins can remove team members' },
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
        { error: 'You cannot remove yourself from the organization' },
        { status: 400 }
      );
    }

    // Verify the target user is in the same organization
    const { data: targetUser } = await supabase
      .from('users')
      .select('organization_id, account_type')
      .eq('id', user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.organization_id !== userData.organization_id) {
      return NextResponse.json(
        { error: 'User is not in your organization' },
        { status: 403 }
      );
    }

    // Disconnect user from organization
    // Change account type from 'hybrid' to 'personal'
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        organization_id: null,
        account_type: 'personal',
        user_role: 'candidate',
        current_context: 'personal',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing team member:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove team member', details: updateError.message },
        { status: 500 }
      );
    }

    // Update auth user metadata
    await supabase.auth.admin.updateUserById(user_id, {
      user_metadata: {
        account_type: 'personal',
        user_role: 'candidate',
        organization_id: null,
        current_context: 'personal',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Team member removed from organization successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

