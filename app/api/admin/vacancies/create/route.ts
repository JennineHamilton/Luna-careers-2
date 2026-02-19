import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import { validateBody } from '@/lib/validation/validate';
import { vacancyCreateSchema } from '@/lib/validation/schemas';

/**
 * POST /api/admin/vacancies/create
 * Create a new vacancy (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Validate request body
    const validation = await validateBody(request, vacancyCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      organization_id,
      title,
      description,
      responsibilities,
      requirements,
      employment_type,
      experience_level,
      is_remote,
      location_city,
      location_state,
      location_country,
      salary_range_min,
      salary_range_max,
      salary_currency,
      required_skills,
      preferred_skills,
    } = validation.data;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Create vacancy
    const { data: vacancy, error: insertError } = await adminClient
      .from('vacancies')
      .insert({
        organization_id,
        title: title.trim(),
        description: description?.trim() || 'No description provided',
        responsibilities: responsibilities?.trim() || null,
        requirements: requirements?.trim() || null,
        employment_type,
        experience_level: experience_level || 'mid',
        is_remote: is_remote || false,
        location_city: is_remote ? null : location_city,
        location_state: is_remote ? null : location_state,
        location_country: is_remote ? null : location_country,
        salary_range_min: salary_range_min || null,
        salary_range_max: salary_range_max || null,
        salary_currency: salary_currency || 'USD',
        required_skills: required_skills || [],
        preferred_skills: preferred_skills || [],
        benefits: [], // Admin doesn't set benefits - comes from org profile
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating vacancy:', insertError);
      return NextResponse.json(
        { error: 'Failed to create vacancy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vacancy,
    });

  } catch (error) {
    console.error('Error in create vacancy API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

