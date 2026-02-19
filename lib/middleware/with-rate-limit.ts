/**
 * Higher-order function to wrap API route handlers with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, RateLimitConfig } from './rate-limit';

type RouteHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with rate limiting
 * 
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *   },
 *   { maxRequests: 5, windowMs: 15 * 60 * 1000 }
 * );
 * ```
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig
): RouteHandler {
  const limiter = rateLimit(config);
  
  return async (request: NextRequest, context?: any) => {
    // Check rate limit
    const rateLimitResponse = limiter(request);
    
    if (rateLimitResponse) {
      // Rate limit exceeded
      return rateLimitResponse;
    }
    
    // Rate limit passed, execute handler
    return handler(request, context);
  };
}

