/**
 * Tests for Database Performance Utilities
 * Tests query measurement, batching, caching, and optimization helpers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  measureQuery,
  batchOperations,
  QueryOptimizations,
  queryCache,
  cachedQuery,
} from '@/lib/utils/db-performance';

describe('Database Performance Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCache.clear();
  });

  describe('measureQuery', () => {
    it('should measure query execution time', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ data: [{ id: 1 }], error: null });
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await measureQuery(mockQuery, 'Test Query');

      expect(mockQuery).toHaveBeenCalledOnce();
      expect(result).toEqual({ data: [{ id: 1 }], error: null });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB Query] Test Query:'),
        expect.stringContaining('ms')
      );

      consoleSpy.mockRestore();
    });

    it('should handle query errors', async () => {
      const mockError = new Error('Database error');
      const mockQuery = vi.fn().mockRejectedValue(mockError);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(measureQuery(mockQuery, 'Failing Query')).rejects.toThrow('Database error');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DB Query Error] Failing Query:'),
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('batchOperations', () => {
    it('should execute multiple operations in batch', async () => {
      const op1 = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const op2 = vi.fn().mockResolvedValue({ data: { id: 2 }, error: null });
      const op3 = vi.fn().mockResolvedValue({ data: { id: 3 }, error: null });

      const results = await batchOperations([op1, op2, op3]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ data: { id: 1 }, error: null });
      expect(results[1]).toEqual({ data: { id: 2 }, error: null });
      expect(results[2]).toEqual({ data: { id: 3 }, error: null });
      expect(op1).toHaveBeenCalledOnce();
      expect(op2).toHaveBeenCalledOnce();
      expect(op3).toHaveBeenCalledOnce();
    });

    it('should handle partial failures in batch', async () => {
      const op1 = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const op2 = vi.fn().mockRejectedValue(new Error('Operation failed'));
      const op3 = vi.fn().mockResolvedValue({ data: { id: 3 }, error: null });

      await expect(batchOperations([op1, op2, op3])).rejects.toThrow('Operation failed');
    });
  });

  describe('QueryOptimizations', () => {
    describe('selectSpecificColumns', () => {
      it('should join columns into comma-separated string', () => {
        const columns = ['id', 'name', 'email'];
        const result = QueryOptimizations.selectSpecificColumns(columns);
        expect(result).toBe('id, name, email');
      });

      it('should handle single column', () => {
        const result = QueryOptimizations.selectSpecificColumns(['id']);
        expect(result).toBe('id');
      });

      it('should handle empty array', () => {
        const result = QueryOptimizations.selectSpecificColumns([]);
        expect(result).toBe('');
      });
    });

    describe('checkExists', () => {
      it('should return true when record exists', async () => {
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          match: vi.fn().mockResolvedValue({ count: 1, error: null }),
        };

        const exists = await QueryOptimizations.checkExists(
          mockSupabase as any,
          'users',
          { id: 'test-id' }
        );

        expect(exists).toBe(true);
        expect(mockSupabase.from).toHaveBeenCalledWith('users');
        expect(mockSupabase.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
        expect(mockSupabase.match).toHaveBeenCalledWith({ id: 'test-id' });
      });

      it('should return false when record does not exist', async () => {
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          match: vi.fn().mockResolvedValue({ count: 0, error: null }),
        };

        const exists = await QueryOptimizations.checkExists(
          mockSupabase as any,
          'users',
          { id: 'nonexistent-id' }
        );

        expect(exists).toBe(false);
      });

      it('should throw error on database error', async () => {
        const mockError = new Error('Database error');
        const mockSupabase = {
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          match: vi.fn().mockResolvedValue({ count: null, error: mockError }),
        };

        await expect(
          QueryOptimizations.checkExists(mockSupabase as any, 'users', { id: 'test-id' })
        ).rejects.toThrow('Database error');
      });
    });
  });

  describe('queryCache', () => {
    it('should cache and retrieve values', () => {
      queryCache.set('test-key', { data: 'test-value' }, 1000);
      const cached = queryCache.get('test-key');
      expect(cached).toEqual({ data: 'test-value' });
    });

    it('should return null for expired cache', async () => {
      queryCache.set('test-key', { data: 'test-value' }, 10); // 10ms TTL
      await new Promise(resolve => setTimeout(resolve, 20)); // Wait 20ms
      const cached = queryCache.get('test-key');
      expect(cached).toBeNull();
    });

    it('should return null for non-existent key', () => {
      const cached = queryCache.get('nonexistent-key');
      expect(cached).toBeNull();
    });
  });
});

