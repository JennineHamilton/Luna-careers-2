/**
 * Tests for SCORM Extraction API
 * Tests POST /api/learning/scorm/extract-background endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/learning/scorm/extract-background/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

vi.mock('adm-zip', () => ({
  default: vi.fn(),
}));

vi.mock('xml2js', () => ({
  parseStringPromise: vi.fn(),
}));

describe('SCORM Extraction API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/learning/scorm/extract-background', () => {
    it('should return 400 when lessonId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/learning/scorm/extract-background', {
        method: 'POST',
        body: JSON.stringify({
          scormPath: 'test/path.zip',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing lessonId or scormPath');
    });

    it('should return 400 when scormPath is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/learning/scorm/extract-background', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'lesson-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing lessonId or scormPath');
    });

    it('should update lesson status to extracting', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDownload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Download failed' },
      });

      (createClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            download: mockDownload,
          }),
        },
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      const request = new NextRequest('http://localhost:3000/api/learning/scorm/extract-background', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'lesson-123',
          scormPath: 'test/path.zip',
        }),
      });

      await POST(request);

      expect(mockUpdate).toHaveBeenCalledWith({
        scorm_extraction_status: 'extracting',
        scorm_extraction_error: null,
      });
    });

    it('should return 500 when download fails', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDownload = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Download failed' },
      });

      (createClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            download: mockDownload,
          }),
        },
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      const request = new NextRequest('http://localhost:3000/api/learning/scorm/extract-background', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'lesson-123',
          scormPath: 'test/path.zip',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to download SCORM package');
    });

    it('should return 400 when imsmanifest.xml is not found', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const AdmZip = (await import('adm-zip')).default;
      
      const mockBlob = new Blob(['test content'], { type: 'application/zip' });
      
      const mockUpdate = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDownload = vi.fn().mockResolvedValue({
        data: mockBlob,
        error: null,
      });

      (createClient as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          update: mockUpdate,
        }),
        storage: {
          from: vi.fn().mockReturnValue({
            download: mockDownload,
          }),
        },
      });

      mockUpdate.mockReturnValue({
        eq: mockEq,
      });

      // Mock AdmZip to return no manifest
      (AdmZip as any).mockImplementation(() => ({
        getEntries: () => [
          { entryName: 'index.html', isDirectory: false },
          { entryName: 'styles.css', isDirectory: false },
        ],
      }));

      const request = new NextRequest('http://localhost:3000/api/learning/scorm/extract-background', {
        method: 'POST',
        body: JSON.stringify({
          lessonId: 'lesson-123',
          scormPath: 'test/path.zip',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid SCORM package: imsmanifest.xml not found');
    });
  });
});

