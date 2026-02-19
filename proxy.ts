import { type NextRequest, NextResponse } from 'next/server';
import {
  createMiddlewareClient,
  getDashboardPath,
  canAccessPath,
  getUserMetadataFromJWT,
} from '@/lib/supabase/middleware';
import type { AccountType, UserContext } from '@/types/auth.types';

// Routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/suspended',
];

// Auth routes that should redirect authenticated users
const authRoutes = ['/login', '/signup'];

const publicPrefixes = ['/courses/', '/assessments/', '/auth/'];

// Routes that should skip middleware entirely (handle their own auth)
const middlewareExcludedPrefixes = [
  '/api/',           // All API routes handle their own auth
  '/_next/',         // Next.js internal routes
  '/favicon.ico',    // Static assets
  '/static/',        // Static assets
];

// Protected portal prefixes
const protectedPrefixes = ['/u/', '/org/', '/cmd/'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for excluded routes (performance optimization)
  if (middlewareExcludedPrefixes.some((prefix) => pathname.startsWith(prefix)) || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Normalize path (remove trailing slash)
  const normalizedPath = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname;

  // Allow public prefixes without auth
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Handle public routes (login, signup, etc.)
  if (publicRoutes.includes(normalizedPath)) {
    // If user is authenticated and trying to access login/signup, redirect to dashboard
    if (authRoutes.includes(normalizedPath)) {
      const { supabase, response } = await createMiddlewareClient(request);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get account_type from JWT metadata (synced by database trigger)
        const metadata = await getUserMetadataFromJWT(supabase);

        if (metadata) {
          let dashboardPath = getDashboardPath(metadata.accountType, metadata.currentContext);

          // If redirecting to organization portal, get the slug
          if (dashboardPath === '/org/dashboard') {
            const organizationId = metadata.organizationId;
            if (organizationId) {
              const { data: org } = await supabase
                .from('organizations')
                .select('slug')
                .eq('id', organizationId)
                .single();

              if (org?.slug) {
                dashboardPath = `/org/${org.slug}/dashboard`;
              }
            }
          }

          return NextResponse.redirect(new URL(dashboardPath, request.url));
        }
      }

      return response;
    }
    return NextResponse.next();
  }

  // Check if route requires protection
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Create Supabase client for auth check
  const { supabase, response } = await createMiddlewareClient(request);

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Get user metadata from JWT (synced by database trigger)
  // This avoids RLS recursion issues when querying the users table
  const metadata = await getUserMetadataFromJWT(supabase);

  if (!metadata) {
    // If no metadata, redirect to login (session might be invalid)
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user is suspended
  if (metadata.isSuspended && pathname !== '/suspended') {
    const suspendedUrl = new URL('/suspended', request.url);
    if (metadata.suspensionReason) {
      suspendedUrl.searchParams.set('reason', metadata.suspensionReason);
    }
    return NextResponse.redirect(suspendedUrl);
  }

  const accountType = metadata.accountType;
  const currentContext = metadata.currentContext;

  // Check if user can access the requested path
  if (!canAccessPath(pathname, accountType, currentContext)) {
    // Redirect to appropriate dashboard
    let dashboardPath = getDashboardPath(accountType, currentContext);

    // If redirecting to organization portal, get the slug
    if (dashboardPath === '/org/dashboard') {
      const organizationId = metadata.organizationId;
      if (organizationId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('slug')
          .eq('id', organizationId)
          .single();

        if (org?.slug) {
          dashboardPath = `/org/${org.slug}/dashboard`;
        }
      }
    }

    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

