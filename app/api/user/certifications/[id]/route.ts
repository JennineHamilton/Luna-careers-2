/**
 * API Route: Individual Certification
 * PATCH /api/user/certifications/[id] - Update certification
 * DELETE /api/user/certifications/[id] - Delete certification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH - Update certification (only if pending or rejected)
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
      .from('certifications')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      certification_title,
      issuing_organization,
      issue_date,
      expiry_date,
      does_not_expire,
      certificate_id,
      certificate_url_external,
      certificate_file_url,
      is_hidden,
    } = body;

    // If only updating is_hidden for verified items, allow it
    if (existing.verification_status === 'verified' && is_hidden !== undefined) {
      const { data: updated, error } = await supabase
        .from('certifications')
        .update({ is_hidden })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating certification visibility:', error);
        return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
      }

      return NextResponse.json({ certification: updated }, { status: 200 });
    }

    // Don't allow editing other fields for verified items
    if (existing.verification_status === 'verified') {
      return NextResponse.json({ error: 'Cannot edit verified certification' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('certifications')
      .update({
        certification_title,
        issuing_organization,
        issue_date,
        expiry_date: does_not_expire ? null : expiry_date,
        does_not_expire: does_not_expire || false,
        certificate_id,
        certificate_url_external,
        certificate_file_url,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating certification:', error);
      return NextResponse.json({ error: 'Failed to update certification' }, { status: 500 });
    }

    return NextResponse.json({ certification: updated });
  } catch (error) {
    console.error('Certification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE - Delete certification (only if pending or rejected)
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
      .from('certifications')
      .select('verification_status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Certification not found' }, { status: 404 });
    }

    if (existing.verification_status === 'verified') {
      return NextResponse.json({ error: 'Cannot delete verified certification' }, { status: 403 });
    }

    const { error } = await supabase
      .from('certifications')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting certification:', error);
      return NextResponse.json({ error: 'Failed to delete certification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Certification deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

