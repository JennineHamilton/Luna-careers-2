import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/badges/[userId]
 * Get user's skill badges
 * Query params: display_on_profile (optional, for public view)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const displayOnProfileOnly = searchParams.get('display_on_profile') === 'true';

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    const isOwnProfile = user.id === userId;

    // Build query
    let query = supabase
      .from('user_skill_badges')
      .select(`
        *,
        assessment_template:assessment_templates(*),
        best_attempt:assessment_attempts(*)
      `)
      .eq('user_id', userId)
      .order('display_order', { ascending: true })
      .order('earned_at', { ascending: false });

    // Filter by display_on_profile if requested (for public view)
    if (displayOnProfileOnly && !isOwnProfile && !isPlatformAdmin) {
      query = query.eq('display_on_profile', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching badges:', error);
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 });
    }

    return NextResponse.json({ badges: data });
  } catch (error) {
    console.error('Error in GET /api/screening/badges/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/screening/badges/[userId]
 * Update badge display settings (user can update their own badges)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    const isOwnProfile = user.id === userId;

    // Only allow users to update their own badges (or platform admins)
    if (!isOwnProfile && !isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own badges' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { badge_id, display_on_profile, display_order } = body;

    if (!badge_id) {
      return NextResponse.json(
        { error: 'badge_id is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (typeof display_on_profile === 'boolean') {
      updateData.display_on_profile = display_on_profile;
    }
    if (typeof display_order === 'number') {
      updateData.display_order = display_order;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_skill_badges')
      .update(updateData)
      .eq('id', badge_id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating badge:', error);
      return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 });
    }

    return NextResponse.json({ badge: data, message: 'Badge updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/screening/badges/[userId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

