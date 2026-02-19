/**
 * Request Logging Middleware
 * Logs API requests for audit trail and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { logInfo, logWarning } from '@/lib/utils/error-logger';
import crypto from 'crypto';

/**
 * Request metadata for logging
 */
export interface RequestMetadata {
  requestId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
}

/**
 * Generate unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string {
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
 * Extract user ID from request (if authenticated)
 */
export async function getUserIdFromRequest(request: NextRequest): Promise<string | undefined> {
  try {
    // Try to get user ID from Supabase session
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Decode JWT to get user ID (without verification - just for logging)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.sub;
    }
  } catch {
    // Ignore errors - user ID is optional for logging
  }
  
  return undefined;
}

/**
 * Log API request
 */
export async function logRequest(request: NextRequest): Promise<RequestMetadata> {
  const requestId = generateRequestId();
  const metadata: RequestMetadata = {
    requestId,
    method: request.method,
    path: request.nextUrl.pathname,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString(),
    userId: await getUserIdFromRequest(request),
  };
  
  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${metadata.requestId}] ${metadata.method} ${metadata.path} - ${metadata.ip}`);
  }
  
  return metadata;
}

/**
 * Log API response
 */
export function logResponse(
  metadata: RequestMetadata,
  response: NextResponse,
  startTime: number
): void {
  const duration = Date.now() - startTime;
  const statusCode = response.status;
  
  const logData = {
    ...metadata,
    duration,
    statusCode,
  };
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
    console.log(
      `${emoji} [${metadata.requestId}] ${metadata.method} ${metadata.path} - ${statusCode} (${duration}ms)`
    );
  }
  
  // Log slow requests in production
  if (process.env.NODE_ENV === 'production') {
    if (duration > 3000) {
      logWarning(`Slow API request: ${metadata.method} ${metadata.path}`, {
        metadata: logData,
      });
    }
    
    // Log errors
    if (statusCode >= 500) {
      logWarning(`API error: ${metadata.method} ${metadata.path}`, {
        metadata: logData,
      });
    }
  }
}

/**
 * Higher-order function to wrap API route handlers with request logging
 */
export function withRequestLogging(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const metadata = await logRequest(request);
    
    // Add request ID to request headers for downstream use
    const requestWithId = new Request(request, {
      headers: new Headers(request.headers),
    });
    requestWithId.headers.set('x-request-id', metadata.requestId);
    
    try {
      // Execute handler
      const response = await handler(request, context);
      
      // Log response
      logResponse(metadata, response, startTime);
      
      // Add request ID to response headers
      response.headers.set('x-request-id', metadata.requestId);
      
      return response;
    } catch (error) {
      // Log error
      logWarning(`Unhandled error in API route: ${metadata.method} ${metadata.path}`, {
        metadata: { ...metadata, error: String(error) },
      });
      
      throw error;
    }
  };
}

