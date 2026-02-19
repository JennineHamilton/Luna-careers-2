import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { validateBody } from '@/lib/validation/validate';
import { organizationProfileUpdateSchema } from '@/lib/validation/schemas';
import { requireAuth } from '@/lib/auth/api-auth';

/**
 * GET /api/organization/profile?slug=<slug>
 * Get organization profile data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Organization slug is required' },
        { status: 400 }
      );
    }

    const auth = await requireAuth();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get user's organization_id
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id, account_type')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 403 }
      );
    }

    // Get organization profile
    const { data: organization, error: orgError } = await adminClient
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('id', userData.organization_id)
      .single();

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Organization fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organization/profile?slug=<slug>
 * Update organization profile data
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Organization slug is required' },
        { status: 400 }
      );
    }

    const auth = await requireAuth();
    if (!auth.authorized) {
      return auth.error;
    }
    const user = auth.user;

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Get user's organization_id and role
    const { data: userData } = await adminClient
      .from('users')
      .select('organization_id, user_role, account_type')
      .eq('id', user.id)
      .single();

    if (!userData?.organization_id) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 403 }
      );
    }

    // Only org_admin can update organization profile
    if (userData.user_role !== 'org_admin') {
      return NextResponse.json(
        { error: 'Only organization admins can update organization profile' },
        { status: 403 }
      );
    }

    // Validate request body
    const validation = await validateBody(request, organizationProfileUpdateSchema);
    if (!validation.success) {
      return validation.error;
    }

    const {
      description,
      website_url,
      industry,
      organization_size,
      founded_year,
      employee_count,
      street_address,
      city,
      state,
      country,
      contact_email,
      contact_phone,
      social_links,
    } = validation.data;

    // Update organization profile
    const { data: updatedOrg, error: updateError } = await adminClient
      .from('organizations')
      .update({
        description,
        website_url,
        industry,
        organization_size,
        founded_year,
        employee_count,
        street_address,
        city,
        state,
        country,
        contact_email,
        contact_phone,
        social_links,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug)
      .eq('id', userData.organization_id)
      .select()
      .single();

    if (updateError) {
      console.error('Organization update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update organization', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: updatedOrg,
    });
  } catch (error) {
    console.error('Organization update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

