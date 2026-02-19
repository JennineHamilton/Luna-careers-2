import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AccountType, UserContext } from '@/types/auth.types';

/**
 * GET /auth/callback
 * Handles OAuth and email confirmation callbacks from Supabase
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') || '/';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(
        new URL('/login?error=Could not authenticate', origin)
      );
    }

    // Handle password recovery - redirect AFTER session is established
    if (type === 'recovery') {
      // Session is now established, user can update password
      return NextResponse.redirect(
        new URL('/reset-password', origin)
      );
    }

    // Determine redirect based on account type from JWT metadata
    if (data?.user) {
      // Get metadata from JWT (synced by database trigger)
      const metadata = data.user.user_metadata || {};
      const accountType = (metadata.account_type ?? 'personal') as AccountType;
      const currentContext = (metadata.current_context ?? 'personal') as UserContext;

      let redirectPath = '/u/dashboard';

      switch (accountType) {
        case 'organization':
          redirectPath = '/org/dashboard';
          break;
        case 'platformAdmin':
          redirectPath = '/cmd/dashboard';
          break;
        case 'hybrid':
          redirectPath = currentContext === 'organization'
            ? '/org/dashboard'
            : '/u/dashboard';
          break;
        default:
          redirectPath = '/u/dashboard';
      }

      // If redirecting to organization portal, get the slug
      if (redirectPath === '/org/dashboard') {
        const organizationId = metadata.organization_id;
        if (organizationId) {
          const { data: org } = await supabase
            .from('organizations')
            .select('slug')
            .eq('id', organizationId)
            .single();

          if (org?.slug) {
            redirectPath = `/org/${org.slug}/dashboard`;
          }
        }
      }

      return NextResponse.redirect(new URL(redirectPath, origin));
    }
  }

  // If no code, redirect to login
  return NextResponse.redirect(new URL('/login', origin));
}

