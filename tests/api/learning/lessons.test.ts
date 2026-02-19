/**
 * Tests for Lessons API Routes
 * Tests GET and POST /api/learning/lessons endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/learning/lessons/route';
import { NextRequest } from 'next/server';

// Mock Supabase and auth helpers
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/app/api/learning/_helpers/auth', () => ({
  verifyPlatformAdmin: vi.fn(),
}));

describe('Lessons API', () => {
  const mockLessons = [
    {
      id: 'lesson-1',
      title: 'Introduction to TypeScript',
      description: 'Learn TypeScript basics',
      scorm_package_url: 'https://storage.example.com/lesson-1.zip',
      scorm_version: '1.2',
      duration_minutes: 30,
      creator_id: 'creator-1',
      has_quiz: true,
      passing_score: 80,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
      creators: {
        id: 'creator-1',
        name: 'Test Creator',
        logo_url: 'https://example.com/logo.png',
      },
    },
    {
      id: 'lesson-2',
      title: 'Advanced React Patterns',
      description: 'Master React patterns',
      scorm_package_url: 'https://storage.example.com/lesson-2.zip',
      scorm_version: '2004',
      duration_minutes: 45,
      creator_id: 'creator-1',
      has_quiz: false,
      passing_score: null,
      created_at: '2024-01-02T00:00:00.000Z',
      updated_at: '2024-01-02T00:00:00.000Z',
      creators: {
        id: 'creator-1',
        name: 'Test Creator',
        logo_url: 'https://example.com/logo.png',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/learning/lessons', () => {
    it('should return all lessons', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      
      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLessons,
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/learning/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(2);
      expect(data.lessons[0].title).toBe('Introduction to TypeScript');
    });

    it('should filter lessons by creator_id', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockLessons[0]],
          error: null,
        }),
      };

      (createAdminClient as any).mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/learning/lessons?creator_id=creator-1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery.eq).toHaveBeenCalledWith('creator_id', 'creator-1');
    });

    it('should filter lessons by has_quiz', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: [mockLessons[0]],
          error: null,
        }),
      };

      (createAdminClient as any).mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/learning/lessons?has_quiz=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery.eq).toHaveBeenCalledWith('has_quiz', true);
    });

    it('should search lessons by title', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockResolvedValue({
          data: [mockLessons[0]],
          error: null,
        }),
      };

      (createAdminClient as any).mockReturnValue(mockQuery);

      const request = new NextRequest('http://localhost:3000/api/learning/lessons?search=TypeScript');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery.ilike).toHaveBeenCalledWith('title', '%TypeScript%');
    });

    it('should return 500 on database error', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      
      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/learning/lessons');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch lessons');
    });
  });

  describe('POST /api/learning/lessons', () => {
    it('should create lesson for platform admin', async () => {
      const { createAdminClient } = await import('@/lib/supabase/server');
      const { verifyPlatformAdmin } = await import('@/app/api/learning/_helpers/auth');
      
      (verifyPlatformAdmin as any).mockResolvedValue({
        authorized: true,
        user: { id: 'admin-id' },
      });

      (createAdminClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLessons[0],
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/learning/lessons', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Introduction to TypeScript',
          description: 'Learn TypeScript basics',
          scorm_package_url: 'https://storage.example.com/lesson-1.zip',
          scorm_version: '1.2',
          duration_minutes: 30,
          creator_id: 'creator-1',
          has_quiz: true,
          passing_score: 80,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.lesson.title).toBe('Introduction to TypeScript');
    });
  });
});

