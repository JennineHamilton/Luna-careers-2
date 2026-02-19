import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTypingPassage } from '@/lib/ai/generate-typing-passage';

/**
 * POST /api/screening/assessments/[id]/generate-passage
 * Generate a unique typing passage for an assessment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the assessment template
    const { data: assessment, error: fetchError } = await supabase
      .from('assessment_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }
      console.error('Error fetching assessment:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
    }

    // Check if assessment is active
    if (!assessment.is_active) {
      return NextResponse.json(
        { error: 'This assessment is not currently active' },
        { status: 400 }
      );
    }

    // Generate passage using AI
    const passage = await generateTypingPassage({
      language: assessment.language || 'en',
      difficulty: 'medium', // Default difficulty
      customPrompt: assessment.passage_generation_prompt || undefined,
    });

    return NextResponse.json({
      passage,
      assessment_id: assessment.id,
      assessment_title: assessment.title,
      duration_seconds: assessment.duration_seconds,
    });
  } catch (error) {
    console.error('Error in POST /api/screening/assessments/[id]/generate-passage:', error);
    return NextResponse.json(
      { error: 'Failed to generate passage' },
      { status: 500 }
    );
  }
}

