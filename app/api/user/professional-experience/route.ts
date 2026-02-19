/**
 * API Route: User Professional Experience
 * GET /api/user/professional-experience - List all user's professional experience
 * POST /api/user/professional-experience - Create new professional experience
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';
import { validateBody } from '@/lib/validation/validate';
import { professionalExperienceCreateSchema } from '@/lib/validation/schemas';

/**
 * GET - List all user's professional experience
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Fetch user's professional experience
    const { data: experiences, error } = await supabase
      .from('professional_experience')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching professional experience:', error);
      return NextResponse.json(
        { error: 'Failed to fetch professional experience' },
        { status: 500 }
      );
    }

    return NextResponse.json({ experiences });
  } catch (error) {
    console.error('Professional experience fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create new professional experience
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateBody(request, professionalExperienceCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      job_title,
      company,
      description,
      location_country,
      start_date,
      end_date,
      currently_working,
    } = validation.data;

    // Create new professional experience
    const { data: newExperience, error } = await supabase
      .from('professional_experience')
      .insert({
        user_id: user.id,
        job_title,
        company,
        description,
        location_country,
        start_date,
        end_date: currently_working ? null : end_date,
        currently_working: currently_working || false,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating professional experience:', error);
      return NextResponse.json(
        { error: 'Failed to create professional experience' },
        { status: 500 }
      );
    }

    return NextResponse.json({ experience: newExperience }, { status: 201 });
  } catch (error) {
    console.error('Professional experience creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

