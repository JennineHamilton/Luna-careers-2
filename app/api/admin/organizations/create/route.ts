/**
 * API Route: Create Organization
 * POST /api/admin/organizations/create
 * 
 * Creates a new organization (platform admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/api-auth';
import type { Database } from '@/types/database.types';

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdmin();
    if (!auth.authorized) {
      return auth.error;
    }

    const supabase = createAdminClient();

    // Parse request body
    const body = await request.json();
    const {
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
    
    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Create organization
    const insertData: Database['public']['Tables']['organizations']['Insert'] = {
      name,
      slug,
      description: description || null,
      industry: industry || null,
      organization_size: organization_size || null,
      website_url: website_url || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      street_address: street_address || null,
      city: city || null,
      state: state || null,
      country: country || null,
      verification_status: 'pending',
      is_active: true,
      social_links: {},
    };

    const { data: organization, error: createError } = await supabase
      .from('organizations')
      .insert(insertData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating organization:', {
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        code: createError.code,
      });
      return NextResponse.json(
        {
          error: 'Failed to create organization',
          details: createError.message,
          code: createError.code,
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      organization,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

