import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

type AssessmentTemplateUpdate = Database['public']['Tables']['assessment_templates']['Update'];

// Validation schema for updating assessment templates
const updateAssessmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  assessment_type: z.enum(['typing', 'transcription', 'multilingual']).optional(),
  language: z.string().optional(),
  duration_seconds: z.number().int().min(30).max(600).optional(),
  has_audio: z.boolean().optional(),
  audio_url: z.string().url().optional().nullable(),
  passage_generation_prompt: z.string().optional().nullable(),
  icon: z.string().optional(),
  category: z.string().optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/screening/assessments/[id]
 * Get a single assessment template
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

    const { data, error } = await supabase
      .from('assessment_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      console.error('Error fetching assessment:', error);
      return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
    }

    return NextResponse.json({ assessment: data });
  } catch (error) {
    console.error('Error in GET /api/screening/assessments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/screening/assessments/[id]
 * Update an assessment template (platform admins only)
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
    const validationResult = updateAssessmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updateData: AssessmentTemplateUpdate = validationResult.data;

    const { data, error } = await supabase
      .from('assessment_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      console.error('Error updating assessment:', error);
      return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
    }

    return NextResponse.json({ assessment: data, message: 'Assessment updated successfully' });
  } catch (error) {
    console.error('Error in PATCH /api/screening/assessments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/screening/assessments/[id]
 * Delete an assessment template (platform admins only)
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('assessment_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assessment:', error);
      return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/screening/assessments/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

