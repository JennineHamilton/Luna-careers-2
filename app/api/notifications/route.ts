/**
 * API Route: Notifications
 * GET /api/notifications - Get user's notifications (personal or organization-scoped)
 * PATCH /api/notifications/[id] - Mark notification as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/notifications
 * Get notifications for the authenticated user.
 * - scope=personal (default): only personal notifications (learning, profile, etc.)
 * - scope=organization&organization_slug=xyz: only notifications for that org (e.g. new applications)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const scope = searchParams.get('scope') || 'personal';
    const organizationSlug = searchParams.get('organization_slug');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (scope === 'organization') {
      if (!organizationSlug) {
        return NextResponse.json(
          { error: 'organization_slug required when scope=organization' },
          { status: 400 }
        );
      }
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', organizationSlug)
        .single();
      if (!org?.id) {
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      query = query.eq('scope', 'organization').eq('organization_id', org.id);
    } else {
      // personal: scope is 'personal' or null (legacy)
      query = query.or('scope.eq.personal,scope.is.null').is('organization_id', null);
    }

    // Filter by unread if requested
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications }, { status: 200 });

  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

