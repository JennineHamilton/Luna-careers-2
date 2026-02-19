import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import { validateBody } from '@/lib/validation/validate';
import { vacancyUpdateSchema } from '@/lib/validation/schemas';

/**
 * POST /api/admin/vacancies/update
 * Update a vacancy (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    // Validate request body
    const validation = await validateBody(request, vacancyUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      vacancy_id,
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
      required_skills,
      preferred_skills,
      application_deadline,
      prerequisite_assessments,
      prerequisite_learning_content,
    } = validation.data;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Update vacancy
    const updatePayload: Record<string, unknown> = {
      title: title.trim(),
      description: description?.trim() ?? null,
      responsibilities: responsibilities?.trim() || null,
      requirements: requirements?.trim() || null,
      employment_type,
      is_remote: is_remote || false,
      location_city: is_remote ? null : location_city,
      location_state: is_remote ? null : location_state,
      location_country: is_remote ? null : location_country,
      salary_range_min: salary_range_min || null,
      salary_range_max: salary_range_max || null,
      required_skills: required_skills || [],
      preferred_skills: preferred_skills || [],
      updated_at: new Date().toISOString(),
    };
    if (experience_level !== undefined) updatePayload.experience_level = experience_level;
    if (application_deadline !== undefined) updatePayload.application_deadline = application_deadline;
    if (prerequisite_assessments !== undefined) updatePayload.prerequisite_assessments = prerequisite_assessments;
    if (prerequisite_learning_content !== undefined) updatePayload.prerequisite_learning_content = prerequisite_learning_content;

    const { data: vacancy, error: updateError } = await adminClient
      .from('vacancies')
      .update(updatePayload)
      .eq('id', vacancy_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating vacancy:', updateError);
      return NextResponse.json(
        { error: 'Failed to update vacancy' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vacancy,
    });

  } catch (error) {
    console.error('Error in update vacancy API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

