import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

type AssessmentAudioFileInsert = Database['public']['Tables']['assessment_audio_files']['Insert'];

const uploadAudioSchema = z.object({
  file_name: z.string().min(1),
  file_url: z.string().url(),
  file_size: z.number().int().optional(),
  duration_seconds: z.number().int().optional(),
  mime_type: z.string().optional(),
  transcript: z.string().optional(),
});

/**
 * GET /api/screening/assessments/[id]/audio
 * Get all audio files for an assessment
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';

    // Build query
    let query = supabase
      .from('assessment_audio_files')
      .select('*')
      .eq('assessment_template_id', id)
      .order('upload_date', { ascending: false });

    // Non-admins only see active files
    if (!isPlatformAdmin) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audio files:', error);
      return NextResponse.json({ error: 'Failed to fetch audio files' }, { status: 500 });
    }

    return NextResponse.json({ audio_files: data });
  } catch (error) {
    console.error('Error in GET /api/screening/assessments/[id]/audio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/screening/assessments/[id]/audio
 * Upload audio file metadata (file should be uploaded to storage first)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const validationResult = uploadAudioSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const audioData: AssessmentAudioFileInsert = {
      assessment_template_id: id,
      ...validationResult.data,
      uploaded_by: user.id,
    };

    const { data, error } = await supabase
      .from('assessment_audio_files')
      .insert(audioData)
      .select()
      .single();

    if (error) {
      console.error('Error creating audio file record:', error);
      return NextResponse.json({ error: 'Failed to create audio file record' }, { status: 500 });
    }

    return NextResponse.json(
      { audio_file: data, message: 'Audio file uploaded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/screening/assessments/[id]/audio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

