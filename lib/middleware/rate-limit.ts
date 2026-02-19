/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for API routes
 *
 * TODO: Replace with Redis-based rate limiting (e.g. @upstash/ratelimit) before
 * production deployment. The current in-memory store does not persist across
 * serverless function invocations or multiple server instances, making it
 * ineffective in production environments.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (request: NextRequest) => string;
  
  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Get client identifier (IP address or custom identifier)
 */
function getIdentifier(request: NextRequest, customIdentifier?: (req: NextRequest) => string): string {
  if (customIdentifier) {
    return customIdentifier(request);
  }
  
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to 'unknown' if no IP headers are present
  return 'unknown';
}

/**
 * Rate limit middleware
 * Returns null if request is allowed, or NextResponse with 429 status if rate limited
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const identifier = getIdentifier(request, config.identifier);
    const key = `${identifier}:${request.nextUrl.pathname}`;
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = store[key];
    
    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      store[key] = entry;
      return null; // Allow request
    }
    
    // Increment counter
    entry.count++;
    
    // Check if limit exceeded
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: config.message || 'Too many requests. Please try again later.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }
    
    // Request allowed
    return null;
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per 15 minutes
   */
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  
  /**
   * Standard rate limit for API endpoints
   * 100 requests per minute
   */
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'API rate limit exceeded. Please slow down.',
  },
  
  /**
   * Relaxed rate limit for read operations
   * 300 requests per minute
   */
  READ: {
    maxRequests: 300,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again shortly.',
  },
} as const;

