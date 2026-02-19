/**
 * Helper functions for API route authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export interface AuthResult {
  authorized: boolean;
  user?: any;
  error?: NextResponse;
}

/**
 * Verify that the request is from an authenticated platform admin
 * Returns { authorized: true, user } if authorized
 * Returns { authorized: false, error: NextResponse } if not authorized
 */
export async function verifyPlatformAdmin(request: NextRequest): Promise<AuthResult> {
  const supabase = createAdminClient();

  // Get the current user from the session
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    console.error('[verifyPlatformAdmin] No authorization header');
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    console.error('[verifyPlatformAdmin] Auth error:', authError);
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }

  // Verify user is platform admin
  const { data: userData } = await supabase
    .from('users')
    .select('account_type')
    .eq('id', user.id)
    .single();

  console.log('[verifyPlatformAdmin] User account type:', userData?.account_type);

  if (userData?.account_type !== 'platformAdmin') {
    console.error('[verifyPlatformAdmin] User is not platform admin:', userData?.account_type);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      )
    };
  }

  return { authorized: true, user };
}

/**
 * Verify that the request is from an authenticated user (any account type)
 * Returns { authorized: true, user } if authorized
 * Returns { authorized: false, error: NextResponse } if not authorized
 */
export async function verifyAuthenticated(request: NextRequest): Promise<AuthResult> {
  const supabase = createAdminClient();
  
  // Get the current user from the session
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  
  if (authError || !user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    };
  }
  
  return { authorized: true, user };
}

