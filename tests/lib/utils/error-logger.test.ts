/**
 * Tests for Error Logger Utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logError,
  logWarning,
  logInfo,
  createErrorResponse,
  safeAsync,
} from '@/lib/utils/error-logger';

describe('Error Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logError', () => {
    it('should log error with context', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      const context = {
        route: '/api/test',
        action: 'test_action',
        userId: 'user-123',
      };

      logError(error, context);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle non-Error objects', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      logError('String error');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logWarning', () => {
    it('should log warning with context', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      logWarning('Test warning', { route: '/api/test' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('logInfo', () => {
    it('should log info in development', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      logInfo('Test info', { key: 'value' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const error = new Error('Test error');
      const response = createErrorResponse(error, 500, {
        route: '/api/test',
      });

      expect(response).toHaveProperty('error');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('statusCode', 500);
      expect(response).toHaveProperty('timestamp');
    });

    it('should handle non-Error objects', () => {
      const response = createErrorResponse('String error', 400);

      expect(response.statusCode).toBe(400);
      expect(response).toHaveProperty('message');
    });
  });

  describe('safeAsync', () => {
    it('should return data on success', async () => {
      const successFn = async () => 'success';
      const [data, error] = await safeAsync(successFn);

      expect(data).toBe('success');
      expect(error).toBeNull();
    });

    it('should return error on failure', async () => {
      const errorFn = async () => {
        throw new Error('Test error');
      };
      const [data, error] = await safeAsync(errorFn);

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
      expect(error?.message).toBe('Test error');
    });

    it('should handle non-Error throws', async () => {
      const errorFn = async () => {
        throw 'String error';
      };
      const [data, error] = await safeAsync(errorFn);

      expect(data).toBeNull();
      expect(error).toBeInstanceOf(Error);
    });
  });
});

