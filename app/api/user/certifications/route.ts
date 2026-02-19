/**
 * API Route: User Certifications
 * GET /api/user/certifications - List all user's certifications
 * POST /api/user/certifications - Create new certification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { certificationCreateSchema } from '@/lib/validation/schemas';

/**
 * GET - List all user's certifications
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: certifications, error } = await supabase
      .from('certifications')
      .select('*')
      .eq('user_id', user.id)
      .order('issue_date', { ascending: false });

    if (error) {
      console.error('Error fetching certifications:', error);
      return NextResponse.json({ error: 'Failed to fetch certifications' }, { status: 500 });
    }

    return NextResponse.json({ certifications });
  } catch (error) {
    console.error('Certifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST - Create new certification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Validate request body
    const validation = await validateBody(request, certificationCreateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      certification_title,
      issuing_organization,
      issue_date,
      expiry_date,
      does_not_expire,
      certificate_id,
      certificate_url_external,
      certificate_file_url,
    } = validation.data;

    const { data: newCertification, error } = await supabase
      .from('certifications')
      .insert({
        user_id: user.id,
        certification_title,
        issuing_organization,
        issue_date,
        expiry_date: does_not_expire ? null : expiry_date,
        does_not_expire: does_not_expire || false,
        certificate_id,
        certificate_url_external,
        certificate_file_url,
        verification_status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating certification:', error);
      return NextResponse.json({ error: 'Failed to create certification' }, { status: 500 });
    }

    return NextResponse.json({ certification: newCertification }, { status: 201 });
  } catch (error) {
    console.error('Certification creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

