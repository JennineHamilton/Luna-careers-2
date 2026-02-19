/**
 * API Route: Individual Professional Experience
 * GET /api/user/professional-experience/[id] - Get single experience
 * PATCH /api/user/professional-experience/[id] - Update experience
 * DELETE /api/user/professional-experience/[id] - Delete experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Get single professional experience
 */
export async function GET(
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

    const { data: experience, error } = await supabase
      .from('professional_experience')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    return NextResponse.json({ experience });
  } catch (error) {
    console.error('Experience fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH - Update professional experience (only if pending or rejected)
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

    // Check if experience exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('professional_experience')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      job_title,
      company,
      description,
      location_country,
      start_date,
      end_date,
      currently_working,
      is_hidden,
    } = body;

    // If only updating is_hidden for verified items, allow it
    if (existing.verification_status === 'verified' && is_hidden !== undefined) {
      const { data: updated, error } = await supabase
        .from('professional_experience')
        .update({ is_hidden })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating experience visibility:', error);
        return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
      }

      return NextResponse.json({ experience: updated }, { status: 200 });
    }

    // Don't allow editing other fields for verified items
    if (existing.verification_status === 'verified') {
      return NextResponse.json(
        { error: 'Cannot edit verified experience' },
        { status: 403 }
      );
    }

    // Update experience and reset to pending status
    const { data: updated, error } = await supabase
      .from('professional_experience')
      .update({
        job_title,
        company,
        description,
        location_country,
        start_date,
        end_date: currently_working ? null : end_date,
        currently_working: currently_working || false,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating experience:', error);
      return NextResponse.json({ error: 'Failed to update experience' }, { status: 500 });
    }

    return NextResponse.json({ experience: updated });
  } catch (error) {
    console.error('Experience update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete professional experience (only if pending or rejected)
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

    // Check if experience exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('professional_experience')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Experience not found' }, { status: 404 });
    }

    // Don't allow deleting verified items
    if (existing.verification_status === 'verified') {
      return NextResponse.json(
        { error: 'Cannot delete verified experience' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('professional_experience')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting experience:', error);
      return NextResponse.json({ error: 'Failed to delete experience' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Experience deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

