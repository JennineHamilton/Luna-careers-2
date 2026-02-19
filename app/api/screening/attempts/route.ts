import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/attempts
 * Get user's assessment attempts
 * Query params: assessment_template_id, is_submitted, limit
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assessmentTemplateId = searchParams.get('assessment_template_id');
    const isSubmitted = searchParams.get('is_submitted');
    const limit = parseInt(searchParams.get('limit') || '50');

    const isPlatformAdmin = user.user_metadata?.account_type === 'platformAdmin';

    // Build query
    let query = supabase
      .from('assessment_attempts')
      .select(`
        *,
        assessment_template:assessment_templates(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Non-admins can only see their own attempts
    if (!isPlatformAdmin) {
      query = query.eq('user_id', user.id);
    }

    // Filter by assessment template
    if (assessmentTemplateId) {
      query = query.eq('assessment_template_id', assessmentTemplateId);
    }

    // Filter by submission status
    if (isSubmitted !== null) {
      query = query.eq('is_submitted', isSubmitted === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching attempts:', error);
      return NextResponse.json({ error: 'Failed to fetch attempts' }, { status: 500 });
    }

    return NextResponse.json({ attempts: data });
  } catch (error) {
    console.error('Error in GET /api/screening/attempts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

