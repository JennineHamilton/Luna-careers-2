/**
 * API Route: Creators Management
 * GET /api/learning/creators - List all creators
 * POST /api/learning/creators - Create new creator (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type Creator = Database['public']['Tables']['creators']['Row'];
type CreatorInsert = Database['public']['Tables']['creators']['Insert'];

/**
 * GET /api/learning/creators
 * List all creators (public access)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    
    let query = supabase
      .from('creators')
      .select('*')
      .order('name', { ascending: true });
    
    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    if (verified !== null) {
      query = query.eq('verified', verified === 'true');
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    
    const { data: creators, error } = await query;
    
    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json(
        { error: 'Failed to fetch creators', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ creators }, { status: 200 });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/learning/creators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/learning/creators
 * Create new creator (platform admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Get the current user from the session
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is platform admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify user is platform admin
    const { data: userData } = await supabase
      .from('users')
      .select('account_type')
      .eq('id', user.id)
      .single();
    
    if (userData?.account_type !== 'platformAdmin') {
      return NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { name, type, bio, logo_url, website_url, verified } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type' },
        { status: 400 }
      );
    }

    // Create creator
    const creatorData: CreatorInsert = {
      name,
      type,
      bio: bio || null,
      logo_url: logo_url || null,
      website_url: website_url || null,
      verified: verified || false,
    };
    
    const { data: creator, error: createError } = await supabase
      .from('creators')
      .insert(creatorData)
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating creator:', createError);
      return NextResponse.json(
        { error: 'Failed to create creator', details: createError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ creator }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/learning/creators:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

