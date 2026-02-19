'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AccountType, UserContext } from '@/types/auth.types';

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginData {
  email: string;
  password: string;
  redirectTo?: string;
}

/**
 * Sign up a new user
 * Always creates a personal account with candidate role
 * The database trigger (handle_new_user) creates the public.users record
 */
export async function signup(data: SignupData): Promise<AuthResult> {
  const supabase = await createClient();

  // Signup always creates a personal account with candidate role
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        account_type: 'personal',
        user_role: 'candidate',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }

  if (!authData.user) {
    return { success: false, error: 'Failed to create user' };
  }

  // Note: The database trigger (handle_new_user) automatically creates
  // the public.users record when auth.users row is inserted

  revalidatePath('/', 'layout');

  return {
    success: true,
    redirectTo: '/login?message=Check your email to confirm your account',
  };
}

/**
 * Log in an existing user
 */
export async function login(data: LoginData): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!authData.user) {
    return { success: false, error: 'Failed to sign in' };
  }

  // Get account_type and current_context from JWT metadata (synced by database trigger)
  const metadata = authData.user.user_metadata || {};
  const accountType = (metadata.account_type ?? 'personal') as AccountType;
  const currentContext = (metadata.current_context ?? 'personal') as UserContext;

  // Log for debugging
  console.log('[LOGIN] User ID:', authData.user.id);
  console.log('[LOGIN] JWT Metadata:', metadata);
  console.log('[LOGIN] Account type:', accountType);
  console.log('[LOGIN] Current context:', currentContext);

  revalidatePath('/', 'layout');

  // Get redirect path - for organization context, include the slug
  let redirectTo = data.redirectTo || getDashboardPath(accountType, currentContext);

  // If redirecting to organization portal, get the slug
  if (redirectTo === '/org/dashboard') {
    const organizationId = metadata.organization_id;
    if (organizationId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', organizationId)
        .single();

      if (orgError) {
        console.error('Error fetching organization slug:', orgError);
      }

      if (org?.slug) {
        redirectTo = `/org/${org.slug}/dashboard`;
      }
    }
  }

  console.log('[LOGIN] Redirecting to:', redirectTo);

  return { success: true, redirectTo };
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

/**
 * Request a password reset
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?type=recovery`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update password (from settings page — requires current password verification)
 */
export async function updatePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
  const supabase = await createClient();

  // Get current user's email
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify current password by attempting to sign in
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Now update the password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Switch context for hybrid users
 */
export async function switchContext(context: UserContext): Promise<AuthResult> {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const accountType = user.user_metadata?.account_type as AccountType;
  if (accountType !== 'hybrid') {
    return { success: false, error: 'Only hybrid users can switch context' };
  }

  // Update auth metadata
  const { error: updateError } = await supabase.auth.updateUser({
    data: { current_context: context },
  });

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Update database
  const { error: dbError } = await supabase
    .from('users')
    .update({ current_context: context })
    .eq('id', user.id);

  if (dbError) {
    console.error('Error updating user context in database:', dbError);
    return { success: false, error: dbError.message };
  }

  revalidatePath('/', 'layout');

  const redirectTo = context === 'organization' ? '/org/dashboard' : '/u/dashboard';
  return { success: true, redirectTo };
}

/**
 * Get dashboard path based on account type and context
 */
function getDashboardPath(accountType: AccountType, currentContext?: UserContext): string {
  switch (accountType) {
    case 'personal':
      return '/u/dashboard';
    case 'organization':
      return '/org/dashboard';
    case 'platformAdmin':
      return '/cmd/dashboard';
    case 'hybrid':
      return currentContext === 'organization' ? '/org/dashboard' : '/u/dashboard';
    default:
      return '/u/dashboard';
  }
}

