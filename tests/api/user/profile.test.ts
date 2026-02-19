/**
 * Tests for User Profile API Routes
 * Tests GET and PATCH /api/user/profile endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/user/profile/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

describe('User Profile API', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      first_name: 'Test',
      last_name: 'User',
    },
  };

  const mockProfile = {
    id: 'test-user-id',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    phone: '+1234567890',
    bio: 'Test bio',
    location: 'Test City',
    linkedin_url: 'https://linkedin.com/in/testuser',
    portfolio_url: 'https://testuser.com',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile for authenticated user', async () => {
      const { createClient, createAdminClient } = await import('@/lib/supabase/server');
      
      // Mock authenticated user
      (createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      // Mock admin client profile fetch
      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockProfile,
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(mockProfile);
    });

    it('should return 401 for unauthenticated user', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      
      (createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });

    it('should return 404 when profile not found', async () => {
      const { createClient, createAdminClient } = await import('@/lib/supabase/server');
      
      (createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Profile not found');
    });

    it('should return 500 on database error', async () => {
      const { createClient, createAdminClient } = await import('@/lib/supabase/server');
      
      (createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
              }),
            }),
          }),
        }),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch profile');
    });
  });

  describe('PATCH /api/user/profile', () => {
    it('should update user profile successfully', async () => {
      const { createClient, createAdminClient } = await import('@/lib/supabase/server');
      
      const updatedProfile = {
        ...mockProfile,
        first_name: 'Updated',
        last_name: 'Name',
      };

      (createClient as any).mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
          updateUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      });

      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: updatedProfile,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          first_name: 'Updated',
          last_name: 'Name',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile.first_name).toBe('Updated');
      expect(data.profile.last_name).toBe('Name');
    });
  });
});

