/**
 * API Route: Update Organization
 * PATCH /api/admin/organizations/update
 * 
 * Updates organization information (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const {
      organization_id,
      name,
      description,
      industry,
      organization_size,
      website_url,
      contact_email,
      contact_phone,
      street_address,
      city,
      state,
      country,
    } = body;
    
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }
    
    // Update organization in database
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (industry !== undefined) updateData.industry = industry || null;
    if (organization_size !== undefined) updateData.organization_size = organization_size || null;
    if (website_url !== undefined) updateData.website_url = website_url || null;
    if (contact_email !== undefined) updateData.contact_email = contact_email || null;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone || null;
    if (street_address !== undefined) updateData.street_address = street_address || null;
    if (city !== undefined) updateData.city = city || null;
    if (state !== undefined) updateData.state = state || null;
    if (country !== undefined) updateData.country = country || null;
    
    const { data: updatedOrg, error: updateError } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', organization_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating organization:', updateError);
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
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

