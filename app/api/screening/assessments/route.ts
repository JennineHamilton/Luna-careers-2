import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Database } from '@/types/database.types';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];
type AssessmentTemplateInsert = Database['public']['Tables']['assessment_templates']['Insert'];


// Validation schema for creating assessment templates
const createAssessmentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  assessment_type: z.enum(['typing', 'transcription', 'multilingual']),
  language: z.string().default('en'),
  duration_seconds: z.number().int().min(30).max(600).default(60),
  has_audio: z.boolean().default(false),
  audio_url: z.string().url().optional().nullable(),
  passage_generation_prompt: z.string().optional().nullable(),
  icon: z.string().default('Keyboard'),
  category: z.string().default('typing'),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

/**
 * GET /api/screening/assessments
 * Get all assessment templates (active only for non-admins)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';

    // Build query
    let query = supabase
      .from('assessment_templates')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Non-admins only see active templates
    if (!isPlatformAdmin) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching assessment templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch assessment templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ assessments: data });
  } catch (error) {
    console.error('Error in GET /api/screening/assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/screening/assessments
 * Create a new assessment template (platform admins only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify platform admin
    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';
    if (!isPlatformAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createAssessmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const assessmentData: AssessmentTemplateInsert = {
      ...validationResult.data,
      created_by: user.id,
    };

    // Insert assessment template
    const { data, error } = await supabase
      .from('assessment_templates')
      .insert(assessmentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment template:', error);
      return NextResponse.json(
        { error: 'Failed to create assessment template' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { assessment: data, message: 'Assessment template created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/screening/assessments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

