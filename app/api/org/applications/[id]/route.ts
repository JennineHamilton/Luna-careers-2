/**
 * PATCH /api/org/applications/[id]
 * Update job application status (org member only). Notifies the applicant.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted', 'withdrawn'] as const;

function formatStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newStatus = body?.status;
    if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    // Load application with vacancy and org
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        user_id,
        status,
        vacancy_id,
        vacancies (
          id,
          organization_id,
          title,
          organizations ( slug )
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const vacancy = application.vacancies as { organization_id: string; title: string; organizations: { slug: string } | null } | null;
    if (!vacancy?.organization_id) {
      return NextResponse.json(
        { error: 'Application or vacancy not found' },
        { status: 404 }
      );
    }

    // Requester must be a member of this organization
    const { data: me } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!me || me.organization_id !== vacancy.organization_id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this application' },
        { status: 403 }
      );
    }

    const applicantUserId = application.user_id as string;

    const { error: updateError } = await supabase
      .from('job_applications')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    // Notify the applicant (personal notification)
    const statusLabel = formatStatusLabel(newStatus);
    const vacancyTitle = vacancy.title || 'your application';

    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: applicantUserId,
      scope: 'personal',
      type: 'application_status_changed',
      title: 'Application status updated',
      message: `Your application for "${vacancyTitle}" has been updated to ${statusLabel}.`,
      action_url: '/u/applications',
      action_label: 'View my applications',
      metadata: {
        application_id: applicationId,
        vacancy_id: application.vacancy_id,
        vacancy_title: vacancyTitle,
        new_status: newStatus,
      },
    });

    if (notifError) {
      console.error('Error creating applicant notification:', notifError);
    }

    return NextResponse.json(
      { success: true, status: newStatus },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/org/applications/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
