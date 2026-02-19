/**
 * Tests for Performance Utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  measureAsync,
  measureSync,
  debounce,
  throttle,
} from '@/lib/utils/performance';

describe('Performance Utilities', () => {
  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      };

      const [result, duration] = await measureAsync(asyncFn, 'Test async');

      expect(result).toBe('result');
      expect(duration).toBeGreaterThan(0);
    });

    it('should work without label', async () => {
      const asyncFn = async () => 'result';
      const [result, duration] = await measureAsync(asyncFn);

      expect(result).toBe('result');
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('measureSync', () => {
    it('should measure sync function execution time', () => {
      const syncFn = () => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };

      const [result, duration] = measureSync(syncFn, 'Test sync');

      expect(result).toBe(499500);
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should not be called yet
      expect(fn).not.toHaveBeenCalled();

      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be called once
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 50);

      debouncedFn('arg1', 'arg2');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();

      // Should be called once immediately
      expect(fn).toHaveBeenCalledTimes(1);

      // Wait for throttle limit
      await new Promise(resolve => setTimeout(resolve, 150));

      // Call again
      throttledFn();

      // Should be called again
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

