import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { generateTypingPassage } from '@/lib/ai/generate-typing-passage';

const prepareAttemptSchema = z.object({
  assessment_template_id: z.string().uuid(),
});

/**
 * POST /api/screening/attempts/prepare
 * Prepare assessment content (passage/audio) without creating an attempt record
 * The attempt will be created when the user actually starts typing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate request
    const body = await request.json();
    const validationResult = prepareAttemptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { assessment_template_id } = validationResult.data;

    // Fetch assessment template
    const { data: assessment, error: fetchError } = await supabase
      .from('assessment_templates')
      .select('*')
      .eq('id', assessment_template_id)
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

    // Generate passage or select random audio file
    let passage = '';
    let audioUrl: string | null = null;
    let audioMimeType: string | null = null;

    if (assessment.has_audio) {
      // Transcription assessment - select random audio file
      const { data: audioFiles, error: audioError } = await supabase
        .from('assessment_audio_files')
        .select('*')
        .eq('assessment_template_id', assessment_template_id)
        .eq('is_active', true);

      if (audioError || !audioFiles || audioFiles.length === 0) {
        return NextResponse.json(
          { error: 'No active audio files available for this assessment' },
          { status: 400 }
        );
      }

      // Select random audio file
      const randomAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
      audioUrl = randomAudio.file_url;
      audioMimeType = randomAudio.mime_type;

      // For transcription, passage is the expected transcript (used for comparison, not shown to user)
      passage = randomAudio.transcript || '';
    } else {
      // Basic typing assessment - generate passage
      passage = await generateTypingPassage({
        language: assessment.language || 'en',
        difficulty: 'medium',
        customPrompt: assessment.passage_generation_prompt || undefined,
      });
    }

    // Return prepared content without creating attempt record
    return NextResponse.json({
      passage, // For transcription, this is the expected transcript (to be stored with attempt, not shown to user)
      audio_url: audioUrl,
      audio_mime_type: audioMimeType,
      duration_seconds: assessment.duration_seconds,
      assessment_title: assessment.title,
      assessment_type: assessment.has_audio ? 'transcription' : 'basic',
      has_audio: assessment.has_audio,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/screening/attempts/prepare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

