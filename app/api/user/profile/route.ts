import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { userProfileUpdateSchema } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/auth/api-auth';

/**
 * GET /api/user/profile
 * Get current user's profile data
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Use admin client to bypass RLS (we've already verified the user is authenticated)
    const adminClient = createAdminClient();

    // Get user profile from database
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', {
        error: profileError,
        userId: user.id,
        userEmail: user.email,
      });
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error (catch):', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update current user's profile data
 */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Validate request body
    const validation = await validateBody(request, userProfileUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      first_name, last_name, phone, bio, location,
      linkedin_url, portfolio_url, intro_video_url,
      profession, city, state, country,
    } = validation.data;

    // Build update object — only include fields that were explicitly sent
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (portfolio_url !== undefined) updateData.portfolio_url = portfolio_url;
    if (intro_video_url !== undefined) updateData.intro_video_url = intro_video_url;
    if (profession !== undefined) updateData.profession = profession;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;

    // Use admin client to bypass RLS (we've already verified the user is authenticated)
    const adminClient = createAdminClient();

    // Update user profile in database
    const { data: updatedProfile, error: updateError } = await adminClient
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    // Update auth metadata (first_name and last_name) - this will trigger sync
    const supabase = await createClient();
    await supabase.auth.updateUser({
      data: {
        first_name,
        last_name,
      },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

