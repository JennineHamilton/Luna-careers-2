'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth, type AuthUser, type UseAuthReturn } from '@/lib/auth/useAuth';

interface AuthContextType extends UseAuthReturn {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}

// Re-export types for convenience
export type { AuthUser };

