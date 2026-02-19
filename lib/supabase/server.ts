import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database.types';

/**
 * Creates a Supabase client for use in server components, server actions, and route handlers
 * Uses Next.js cookies for session management
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if middleware is refreshing user sessions.
            // Only log in development to avoid noise
            if (process.env.NODE_ENV === 'development') {
              console.warn('Failed to set cookies in Server Component:', error);
            }
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role key
 * BYPASSES RLS - Use only for admin operations after verifying user permissions
 * Should only be called from server components or API routes
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

