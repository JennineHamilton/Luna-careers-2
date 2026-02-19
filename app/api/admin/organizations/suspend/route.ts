/**
 * API Route: Suspend/Unsuspend Organization
 * POST /api/admin/organizations/suspend
 * 
 * Suspends or unsuspends an organization (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const { organization_id, suspend, reason } = body;
    
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }
    
    if (suspend && !reason) {
      return NextResponse.json(
        { error: 'reason is required when suspending an organization' },
        { status: 400 }
      );
    }
    
    // Update organization active status
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update({
        is_active: !suspend,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organization_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating organization status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization status', details: updateError.message },
        { status: 500 }
      );
    }
    
    // If suspending, also suspend all organization members
    if (suspend) {
      await supabase
        .from('users')
        .update({
          is_suspended: true,
          suspension_reason: `Organization suspended: ${reason}`,
          suspended_at: new Date().toISOString(),
          suspended_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organization_id);
    } else {
      // When unsuspending, unsuspend all members
      await supabase
        .from('users')
        .update({
          is_suspended: false,
          suspension_reason: null,
          suspended_at: null,
          suspended_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organization_id);
    }
    
    return NextResponse.json({
      success: true,
      organization: updatedOrg,
      message: suspend ? 'Organization suspended successfully' : 'Organization unsuspended successfully',
    });
  } catch (error) {
    console.error('Suspend organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

