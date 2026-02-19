/**
 * Tests for Authentication Actions
 * Tests login, signup, and logout functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup, login, logout } from '@/lib/auth/actions';
import type { SignupData, LoginData } from '@/lib/auth/actions';

// Mock Next.js functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  })),
}));

describe('Authentication Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully create a new user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();
      
      (mockSupabase.auth.signUp as any).mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const signupData: SignupData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await signup(signupData);

      expect(result.success).toBe(true);
      expect(result.redirectTo).toContain('/login');
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
          },
        },
      });
    });

    it('should return error when signup fails', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();
      
      (mockSupabase.auth.signUp as any).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      const signupData: SignupData = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await signup(signupData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already exists');
    });

    it('should validate required fields', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();
      
      (mockSupabase.auth.signUp as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const signupData: SignupData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'Test',
        lastName: 'User',
      };

      const result = await signup(signupData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create user');
    });
  });

  describe('login', () => {
    it('should successfully log in a user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      const mockSupabase = await createClient();
      
      (mockSupabase.auth.signInWithPassword as any).mockResolvedValue({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              account_type: 'personal',
              current_context: 'personal',
            },
          },
        },
        error: null,
      });

      const loginData: LoginData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const result = await login(loginData);

      expect(result.success).toBe(true);
      expect(result.redirectTo).toBeDefined();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: loginData.email,
        password: loginData.password,
      });
    });
  });
});

