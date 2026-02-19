/**
 * Tests for Supabase Middleware
 * Tests route protection, access control, and user context
 */

import { describe, it, expect } from 'vitest';
import { canAccessPath, getDashboardPath } from '@/lib/supabase/middleware';
import type { AccountType, UserContext } from '@/types/auth.types';

describe('Supabase Middleware', () => {
  describe('canAccessPath', () => {
    describe('Personal Portal (/u/*)', () => {
      it('should allow personal users to access personal portal', () => {
        const result = canAccessPath('/u/dashboard', 'personal');
        expect(result).toBe(true);
      });

      it('should allow hybrid users to access personal portal', () => {
        const result = canAccessPath('/u/dashboard', 'hybrid');
        expect(result).toBe(true);
      });

      it('should deny organization users access to personal portal', () => {
        const result = canAccessPath('/u/dashboard', 'organization');
        expect(result).toBe(false);
      });

      it('should deny platform admins access to personal portal', () => {
        const result = canAccessPath('/u/dashboard', 'platformAdmin');
        expect(result).toBe(false);
      });
    });

    describe('Organization Portal (/org/*)', () => {
      it('should allow organization users to access organization portal', () => {
        const result = canAccessPath('/org/dashboard', 'organization');
        expect(result).toBe(true);
      });

      it('should allow hybrid users to access organization portal', () => {
        const result = canAccessPath('/org/dashboard', 'hybrid');
        expect(result).toBe(true);
      });

      it('should deny personal users access to organization portal', () => {
        const result = canAccessPath('/org/dashboard', 'personal');
        expect(result).toBe(false);
      });

      it('should deny platform admins access to organization portal', () => {
        const result = canAccessPath('/org/dashboard', 'platformAdmin');
        expect(result).toBe(false);
      });
    });

    describe('Admin Portal (/cmd/*)', () => {
      it('should allow platform admins to access admin portal', () => {
        const result = canAccessPath('/cmd/dashboard', 'platformAdmin');
        expect(result).toBe(true);
      });

      it('should deny personal users access to admin portal', () => {
        const result = canAccessPath('/cmd/dashboard', 'personal');
        expect(result).toBe(false);
      });

      it('should deny organization users access to admin portal', () => {
        const result = canAccessPath('/cmd/dashboard', 'organization');
        expect(result).toBe(false);
      });

      it('should deny hybrid users access to admin portal', () => {
        const result = canAccessPath('/cmd/dashboard', 'hybrid');
        expect(result).toBe(false);
      });
    });

    describe('Public Routes', () => {
      it('should allow all users to access public routes', () => {
        const accountTypes: AccountType[] = ['personal', 'organization', 'hybrid', 'platformAdmin'];
        
        accountTypes.forEach(accountType => {
          expect(canAccessPath('/login', accountType)).toBe(true);
          expect(canAccessPath('/signup', accountType)).toBe(true);
          expect(canAccessPath('/about', accountType)).toBe(true);
        });
      });
    });
  });

  describe('getDashboardPath', () => {
    it('should return personal dashboard for personal users', () => {
      const path = getDashboardPath('personal', 'personal');
      expect(path).toBe('/u/dashboard');
    });

    it('should return organization dashboard for organization users', () => {
      const path = getDashboardPath('organization', 'organization');
      expect(path).toBe('/org/dashboard');
    });

    it('should return admin dashboard for platform admins', () => {
      const path = getDashboardPath('platformAdmin', 'personal');
      expect(path).toBe('/cmd/dashboard');
    });

    it('should return personal dashboard for hybrid users in personal context', () => {
      const path = getDashboardPath('hybrid', 'personal');
      expect(path).toBe('/u/dashboard');
    });

    it('should return organization dashboard for hybrid users in organization context', () => {
      const path = getDashboardPath('hybrid', 'organization');
      expect(path).toBe('/org/dashboard');
    });

    it('should default to personal dashboard for hybrid users without context', () => {
      const path = getDashboardPath('hybrid');
      expect(path).toBe('/u/dashboard');
    });
  });
});

