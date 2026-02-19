/**
 * Database Performance Utilities
 * Helpers for optimizing Supabase queries and monitoring database performance
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logWarning } from './error-logger';

/**
 * Query performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,
  ACCEPTABLE: 500,
  SLOW: 1000,
} as const;

/**
 * Measure database query performance
 * Logs slow queries in development
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<T> {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;

  // Log slow queries in development
  if (process.env.NODE_ENV === 'development') {
    if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
      console.warn(`🐌 SLOW QUERY (${duration.toFixed(2)}ms): ${queryName}`);
    } else if (duration > PERFORMANCE_THRESHOLDS.ACCEPTABLE) {
      console.log(`⚠️ Acceptable query (${duration.toFixed(2)}ms): ${queryName}`);
    } else if (duration > PERFORMANCE_THRESHOLDS.FAST) {
      console.log(`✅ Fast query (${duration.toFixed(2)}ms): ${queryName}`);
    }
  }

  // Log very slow queries in production
  if (process.env.NODE_ENV === 'production' && duration > PERFORMANCE_THRESHOLDS.SLOW) {
    logWarning(`Slow database query: ${queryName}`, {
      metadata: { duration, threshold: PERFORMANCE_THRESHOLDS.SLOW },
    });
  }

  return result;
}

/**
 * Batch database operations to reduce round trips
 * Groups multiple operations into a single transaction
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(operations.map(op => op()));
}

/**
 * Common query optimizations
 */
export const QueryOptimizations = {
  /**
   * Select only needed columns instead of *
   * Example: select('id, name, email') instead of select('*')
   */
  selectSpecificColumns: (columns: string[]) => columns.join(', '),

  /**
   * Use count with head: true for existence checks
   * More efficient than fetching full data
   */
  checkExists: async (
    supabase: SupabaseClient,
    table: string,
    filter: Record<string, any>
  ): Promise<boolean> => {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .match(filter);

    if (error) throw error;
    return (count ?? 0) > 0;
  },

  /**
   * Use pagination for large datasets
   */
  paginate: (page: number, pageSize: number = 20) => ({
    from: page * pageSize,
    to: (page + 1) * pageSize - 1,
  }),

  /**
   * Use single() when expecting one result
   * Throws error if multiple results found
   */
  expectSingle: '.single()',

  /**
   * Use maybeSingle() when result might not exist
   * Returns null if no result found
   */
  expectMaybeSingle: '.maybeSingle()',
};

/**
 * Cache wrapper for database queries
 * Simple in-memory cache with TTL
 */
class QueryCache {
  private cache = new Map<string, { data: any; expires: number }>();

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const queryCache = new QueryCache();

/**
 * Cached query wrapper
 * Caches query results for specified TTL
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 60000
): Promise<T> {
  // Check cache first
  const cached = queryCache.get<T>(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`💾 Cache HIT: ${key}`);
    }
    return cached;
  }

  // Execute query
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Cache MISS: ${key}`);
  }
  const result = await queryFn();

  // Cache result
  queryCache.set(key, result, ttlMs);

  return result;
}

