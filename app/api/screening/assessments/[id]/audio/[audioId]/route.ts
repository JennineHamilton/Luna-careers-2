import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/screening/assessments/[id]/audio/[audioId]
 * Delete (soft delete) an audio file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id, audioId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('assessment_audio_files')
      .update({ is_active: false })
      .eq('id', audioId)
      .eq('assessment_template_id', id);

    if (error) {
      console.error('Error deleting audio file:', error);
      return NextResponse.json({ error: 'Failed to delete audio file' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Audio file deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/screening/assessments/[id]/audio/[audioId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/screening/assessments/[id]/audio/[audioId]
 * Update audio file metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; audioId: string }> }
) {
  try {
    const { id, audioId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { is_active } = body;

    const updateData: any = {};
    if (typeof is_active === 'boolean') {
      updateData.is_active = is_active;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('assessment_audio_files')
      .update(updateData)
      .eq('id', audioId)
      .eq('assessment_template_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating audio file:', error);
      return NextResponse.json({ error: 'Failed to update audio file' }, { status: 500 });
    }

    return NextResponse.json({ audio_file: data, message: 'Audio file updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/screening/assessments/[id]/audio/[audioId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

