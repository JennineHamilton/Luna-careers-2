/**
 * Test Utilities and Helpers
 * Common utilities for writing tests
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement, ReactNode } from 'react';

/**
 * Custom render function that wraps components with common providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock organization data for testing
 */
export const mockOrganization = {
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  created_at: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock lesson data for testing
 */
export const mockLesson = {
  id: 'test-lesson-id',
  title: 'Test Lesson',
  description: 'Test lesson description',
  content_type: 'scorm' as const,
  scorm_version: '1.2' as const,
  created_at: '2024-01-01T00:00:00.000Z',
};

/**
 * Mock Supabase response
 */
export function mockSupabaseResponse<T>(data: T, error: any = null) {
  return {
    data,
    error,
    count: null,
    status: error ? 400 : 200,
    statusText: error ? 'Bad Request' : 'OK',
  };
}

/**
 * Wait for async operations to complete
 */
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Create mock file for upload testing
 */
export function createMockFile(
  name: string = 'test.zip',
  size: number = 1024,
  type: string = 'application/zip'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

/**
 * Mock fetch response
 */
export function mockFetchResponse<T>(data: T, status: number = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

