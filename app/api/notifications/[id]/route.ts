/**
 * API Route: Single Notification
 * PATCH /api/notifications/[id] - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this notification
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json(
        { error: 'Failed to update notification', details: error.message },
        { status: 500 }
      );
    }

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification }, { status: 200 });

  } catch (error) {
    console.error('Error in notification update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

