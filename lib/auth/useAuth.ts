'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { AccountType, UserContext, UserRole } from '@/types/auth.types';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  userRole: UserRole;
  currentContext?: UserContext;
  organizationId?: string;
  avatarUrl?: string | null;
  organizationLogoUrl?: string | null;
  organizationName?: string | null;
}

export interface UseAuthReturn {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  switchContext: (context: UserContext) => Promise<void>;
  refreshUser: () => Promise<void>;
}

function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) return null;

  // Construct full name from first_name and last_name in metadata
  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'User';

  console.log('[useAuth] User metadata:', {
    account_type: user.user_metadata?.account_type,
    user_role: user.user_metadata?.user_role,
    organization_id: user.user_metadata?.organization_id,
    current_context: user.user_metadata?.current_context,
  });

  return {
    id: user.id,
    email: user.email || '',
    fullName,
    accountType: (user.user_metadata?.account_type as AccountType) || 'personal',
    userRole: (user.user_metadata?.user_role as UserRole) || 'candidate',
    currentContext: user.user_metadata?.current_context as UserContext | undefined,
    organizationId: user.user_metadata?.organization_id as string | undefined,
  };
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fetchExtendedUserData = useCallback(async (supabaseUser: User | null): Promise<AuthUser | null> => {
    if (!supabaseUser) return null;

    const baseUser = mapSupabaseUser(supabaseUser);
    if (!baseUser) return null;

    try {
      // Fetch user's avatar_url from users table
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', supabaseUser.id)
        .single();

      baseUser.avatarUrl = userData?.avatar_url || null;

      // If user has an organization, fetch organization logo
      if (baseUser.organizationId) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('logo_url, name')
          .eq('id', baseUser.organizationId)
          .single();

        baseUser.organizationLogoUrl = orgData?.logo_url || null;
        baseUser.organizationName = orgData?.name || null;
      }

      return baseUser;
    } catch (error) {
      console.error('Failed to fetch extended user data:', error);
      return baseUser;
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      const extendedUser = await fetchExtendedUserData(supabaseUser);
      setUser(extendedUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  }, [supabase, fetchExtendedUserData]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      setIsLoading(true);
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        const extendedUser = await fetchExtendedUserData(supabaseUser);
        setUser(extendedUser);
      } catch (error) {
        console.error('Failed to get session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const extendedUser = await fetchExtendedUserData(session?.user ?? null);
          setUser(extendedUser);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchExtendedUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  }, [supabase, router]);

  const switchContext = useCallback(async (context: UserContext) => {
    if (!user || user.accountType !== 'hybrid') {
      throw new Error('Only hybrid users can switch context');
    }

    const response = await fetch('/api/auth/switch-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to switch context');
    }

    const { redirectUrl } = await response.json();
    
    // Refresh user data
    await refreshUser();
    
    // Redirect to appropriate dashboard
    router.push(redirectUrl);
    router.refresh();
  }, [user, router, refreshUser]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    switchContext,
    refreshUser,
  };
}

