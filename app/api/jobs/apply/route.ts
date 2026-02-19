/**
 * POST /api/jobs/apply
 * Submit a job application and notify organization team members.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const vacancyId = body?.vacancy_id;
    const consentGiven = body?.consent_given === true;

    if (!vacancyId || typeof vacancyId !== 'string') {
      return NextResponse.json(
        { error: 'vacancy_id is required' },
        { status: 400 }
      );
    }

    // Load vacancy and organization
    const { data: vacancy, error: vacancyError } = await supabase
      .from('vacancies')
      .select('id, organization_id, title, organizations(slug)')
      .eq('id', vacancyId)
      .eq('is_active', true)
      .single();

    if (vacancyError || !vacancy) {
      return NextResponse.json(
        { error: 'Vacancy not found or inactive' },
        { status: 404 }
      );
    }

    const organizationId = vacancy.organization_id as string;
    const orgSlug = (vacancy.organizations as { slug?: string } | null)?.slug;
    const vacancyTitle = vacancy.title;

    // Prevent duplicate application
    const { data: existing } = await supabase
      .from('job_applications')
      .select('id')
      .eq('vacancy_id', vacancyId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied to this position' },
        { status: 409 }
      );
    }

    // Create application
    const { error: insertError } = await supabase
      .from('job_applications')
      .insert({
        user_id: user.id,
        vacancy_id: vacancyId,
        consent_given: consentGiven,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error creating job application:', insertError);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Notify all organization members (use admin client to read members)
    const admin = createAdminClient();
    const { data: members } = await admin
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId);

    if (members && members.length > 0 && orgSlug) {
      const applicantsUrl = `/org/${orgSlug}/applicants`;
      const inserts = members
        .filter((m): m is { id: string } => m.id != null)
        .map((m) => ({
          user_id: m.id,
          scope: 'organization',
          organization_id: organizationId,
          type: 'new_application',
          title: 'New job application',
          message: `A new application was submitted for "${vacancyTitle}".`,
          action_url: applicantsUrl,
          action_label: 'View applicants',
          metadata: { vacancy_id: vacancyId, vacancy_title: vacancyTitle },
        }));

      if (inserts.length > 0) {
        await admin.from('notifications').insert(inserts);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/jobs/apply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
