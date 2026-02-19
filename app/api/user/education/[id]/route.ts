/**
 * API Route: Individual Education
 * PATCH /api/user/education/[id] - Update education
 * DELETE /api/user/education/[id] - Delete education
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH - Update education (only if pending or rejected)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('education')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      institution,
      education_level,
      field_of_study,
      start_date,
      end_date,
      currently_enrolled,
      certificate_url,
      is_hidden,
    } = body;

    // If only updating is_hidden for verified items, allow it
    if (existing.verification_status === 'verified' && is_hidden !== undefined) {
      const { data: updated, error } = await supabase
        .from('education')
        .update({ is_hidden })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating education visibility:', error);
        return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
      }

      return NextResponse.json({ education: updated }, { status: 200 });
    }

    // Don't allow editing other fields for verified items
    if (existing.verification_status === 'verified') {
      return NextResponse.json({ error: 'Cannot edit verified education' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('education')
      .update({
        institution,
        education_level,
        field_of_study,
        start_date,
        end_date: currently_enrolled ? null : end_date,
        currently_enrolled: currently_enrolled || false,
        certificate_url,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating education:', error);
      return NextResponse.json({ error: 'Failed to update education' }, { status: 500 });
    }

    return NextResponse.json({ education: updated });
  } catch (error) {
    console.error('Education update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete education (only if pending or rejected)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('education')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Education not found' }, { status: 404 });
    }

    if (existing.verification_status === 'verified') {
      return NextResponse.json({ error: 'Cannot delete verified education' }, { status: 403 });
    }

    const { error } = await supabase
      .from('education')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting education:', error);
      return NextResponse.json({ error: 'Failed to delete education' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Education deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

