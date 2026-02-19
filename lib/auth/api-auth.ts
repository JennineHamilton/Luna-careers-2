/**
 * Centralized API Route Authentication Helpers
 * 
 * Provides cookie-based auth helpers for API routes.
 * Use these instead of inlining auth checks in every route handler.
 * 
 * For header-based (Bearer token) auth, see app/api/learning/_helpers/auth.ts
 */

import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface AuthSuccess {
  authorized: true;
  user: User;
}

export interface AuthFailure {
  authorized: false;
  error: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * Verify that the request is from an authenticated user (cookie-based).
 * Uses the server-side Supabase client which reads session from cookies.
 * 
 * @returns { authorized: true, user } on success
 * @returns { authorized: false, error: NextResponse } on failure
 */
export async function requireAuth(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      };
    }

    return { authorized: true, user };
  } catch {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 401 }),
    };
  }
}

/**
 * Verify that the request is from an authenticated platform admin (cookie-based).
 * Checks both authentication and account_type === 'platformAdmin'.
 * 
 * @returns { authorized: true, user } on success
 * @returns { authorized: false, error: NextResponse } on failure
 */
export async function requirePlatformAdmin(): Promise<AuthResult> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return auth;
  }

  const accountType = auth.user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Forbidden: Platform admin access required' },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Verify that the request is from an authenticated organization admin (cookie-based).
 * Checks authentication and verifies the user belongs to an org with org_admin role.
 * 
 * @returns { authorized: true, user } on success with orgData in extended result
 * @returns { authorized: false, error: NextResponse } on failure
 */
export async function requireOrgAdmin(): Promise<
  AuthResult & { organizationId?: string }
> {
  const auth = await requireAuth();
  if (!auth.authorized) {
    return auth;
  }

  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('organization_id, user_role')
    .eq('id', auth.user.id)
    .single();

  if (!userData?.organization_id) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 403 }
      ),
    };
  }

  if (userData.user_role !== 'org_admin') {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Only organization admins can perform this action' },
        { status: 403 }
      ),
    };
  }

  return { ...auth, organizationId: userData.organization_id };
}

