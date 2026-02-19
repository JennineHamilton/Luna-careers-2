/**
 * API Route: User Education
 * GET /api/user/education - List all user's education
 * POST /api/user/education - Create new education
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { educationCreateSchema } from '@/lib/validation/schemas';

/**
 * GET - List all user's education
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: education, error } = await supabase
      .from('education')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching education:', error);
      return NextResponse.json({ error: 'Failed to fetch education' }, { status: 500 });
    }

    return NextResponse.json({ education });
  } catch (error) {
    console.error('Education fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create new education
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateBody(request, educationCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      institution,
      education_level,
      field_of_study,
      start_date,
      end_date,
      currently_enrolled,
      certificate_url,
    } = validation.data;

    const { data: newEducation, error } = await supabase
      .from('education')
      .insert({
        user_id: user.id,
        institution,
        education_level,
        field_of_study,
        start_date,
        end_date: currently_enrolled ? null : end_date,
        currently_enrolled: currently_enrolled || false,
        certificate_url,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating education:', error);
      return NextResponse.json({ error: 'Failed to create education' }, { status: 500 });
    }

    return NextResponse.json({ education: newEducation }, { status: 201 });
  } catch (error) {
    console.error('Education creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

