import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/screening/assessments/active
 * Get all active assessments (public access for authenticated users)
 * Query params: ?language=en&type=typing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const type = searchParams.get('type');

    // Build query
    let query = supabase
      .from('assessment_templates')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (language) {
      query = query.eq('language', language);
    }

    if (type) {
      query = query.eq('assessment_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching active assessments:', error);
      return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
    }

    return NextResponse.json({ assessments: data || [] });
  } catch (error) {
    console.error('Error in GET /api/screening/assessments/active:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

