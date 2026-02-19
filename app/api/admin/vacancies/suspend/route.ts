import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

/**
 * POST /api/admin/vacancies/suspend
 * Suspend or unsuspend a vacancy (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Parse request body
    const body = await request.json();
    const { vacancy_id, suspend, reason } = body;

    if (!vacancy_id) {
      return NextResponse.json(
        { error: 'Vacancy ID is required' },
        { status: 400 }
      );
    }

    if (suspend && !reason?.trim()) {
      return NextResponse.json(
        { error: 'Reason is required for suspension' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Update vacancy status
    const { error: updateError } = await adminClient
      .from('vacancies')
      .update({
        is_active: !suspend,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vacancy_id);

    if (updateError) {
      console.error('Error updating vacancy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vacancy' },
        { status: 500 }
      );
    }

    // If suspending, store the suspension reason
    // Note: You may want to create a suspension_logs table to track this
    // For now, we'll just log it
    if (suspend) {
      // TODO: Store in suspension_logs table if it exists
    }

    return NextResponse.json({
      success: true,
      message: suspend ? 'Vacancy suspended successfully' : 'Vacancy unsuspended successfully',
    });

  } catch (error) {
    console.error('Error in suspend vacancy API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

