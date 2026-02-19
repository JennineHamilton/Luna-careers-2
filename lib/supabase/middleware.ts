import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database.types';
import type { AccountType, UserContext } from '@/types/auth.types';

/**
 * Creates a Supabase client for use in middleware
 * Handles cookie management for session persistence
 */
export async function createMiddlewareClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  return { supabase, response: supabaseResponse };
}

/**
 * Extracts user metadata from JWT token
 * This is used to get account_type and other user info without querying the database
 * The metadata is synced by the sync_user_metadata trigger in the database
 */
export async function getUserMetadataFromJWT(supabase: ReturnType<typeof createServerClient<Database>>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Extract metadata from JWT (synced by database trigger)
  const metadata = user.user_metadata || {};

  return {
    accountType: (metadata.account_type as AccountType) || 'personal',
    currentContext: (metadata.current_context as UserContext) || undefined,
    userRole: metadata.user_role,
    organizationId: metadata.organization_id,
    isSuspended: metadata.is_suspended || false,
    suspensionReason: metadata.suspension_reason || null,
  };
}

/**
 * Gets the appropriate dashboard path based on account type and context
 */
export function getDashboardPath(
  accountType: AccountType,
  currentContext?: UserContext
): string {
  switch (accountType) {
    case 'personal':
      return '/u/dashboard';
    case 'organization':
      return '/org/dashboard';
    case 'platformAdmin':
      return '/cmd/dashboard';
    case 'hybrid':
      return currentContext === 'organization'
        ? '/org/dashboard'
        : '/u/dashboard';
    default:
      return '/login';
  }
}

/**
 * Checks if a user can access a specific portal path
 * Note: hybrid users can access BOTH /u/* and /org/* portals
 * current_context only determines default dashboard, not access restrictions
 */
export function canAccessPath(
  path: string,
  accountType: AccountType,
  _currentContext?: UserContext
): boolean {
  if (path.startsWith('/u/')) {
    // Personal portal: accessible by personal and hybrid users
    return accountType === 'personal' || accountType === 'hybrid';
  }

  if (path.startsWith('/org/')) {
    // Organization portal: accessible by organization and hybrid users
    return accountType === 'organization' || accountType === 'hybrid';
  }

  if (path.startsWith('/cmd/')) {
    // Admin portal: only platform admins
    return accountType === 'platformAdmin';
  }

  return true;
}

