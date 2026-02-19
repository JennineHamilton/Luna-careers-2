/**
 * Error Response Utilities
 * Sanitize error responses to prevent information leakage in production
 */

import { NextResponse } from 'next/server';
import { logError, logWarning } from './error-logger';

/**
 * Database error patterns that should not be exposed to clients
 */
const SENSITIVE_ERROR_PATTERNS = [
  /relation ".*" does not exist/i,
  /column ".*" does not exist/i,
  /duplicate key value violates unique constraint/i,
  /violates foreign key constraint/i,
  /violates check constraint/i,
  /syntax error at or near/i,
  /permission denied for/i,
  /role ".*" does not exist/i,
  /database ".*" does not exist/i,
  /connection refused/i,
  /connection timeout/i,
];

/**
 * Check if error message contains sensitive information
 */
function isSensitiveError(message: string): boolean {
  return SENSITIVE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Sanitize error message for production
 * Removes database details and internal implementation info
 */
export function sanitizeErrorMessage(error: unknown): string {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, show full error
  if (isDevelopment) {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  
  // In production, sanitize
  if (error instanceof Error) {
    const message = error.message;
    
    // Check for sensitive patterns
    if (isSensitiveError(message)) {
      return 'A database error occurred. Please try again later.';
    }
    
    // Check for Supabase-specific errors
    if (message.includes('Supabase') || message.includes('PostgreSQL')) {
      return 'A database error occurred. Please try again later.';
    }
    
    // Return generic message for unknown errors
    return 'An unexpected error occurred. Please try again later.';
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Create error response with proper logging and sanitization
 */
export function createErrorResponse(
  error: unknown,
  context: string,
  statusCode: number = 500
): NextResponse {
  // Log the full error for debugging
  logError(error instanceof Error ? error : new Error(String(error)), {
    metadata: { context, statusCode },
  });
  
  // Sanitize error message for client
  const clientMessage = sanitizeErrorMessage(error);
  
  return NextResponse.json(
    { error: clientMessage },
    { status: statusCode }
  );
}

/**
 * Create validation error response
 */
export function createValidationError(
  message: string,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status: 400 }
  );
}

/**
 * Create unauthorized error response
 */
export function createUnauthorizedError(
  message: string = 'Unauthorized'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create forbidden error response
 */
export function createForbiddenError(
  message: string = 'Forbidden'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Create not found error response
 */
export function createNotFoundError(
  resource: string = 'Resource'
): NextResponse {
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Create conflict error response
 */
export function createConflictError(
  message: string = 'Resource already exists'
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 409 }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse {
  return NextResponse.json(data, { status: statusCode });
}

/**
 * Handle Supabase error and return appropriate response
 */
export function handleSupabaseError(
  error: any,
  context: string
): NextResponse {
  // Log the error
  logWarning(`Supabase error in ${context}`, {
    metadata: {
      code: error?.code,
      message: error?.message,
      details: error?.details,
    },
  });
  
  // Map common Supabase errors to appropriate HTTP status codes
  if (error?.code === 'PGRST116') {
    // No rows returned
    return createNotFoundError();
  }
  
  if (error?.code === '23505') {
    // Unique constraint violation
    return createConflictError('This record already exists');
  }
  
  if (error?.code === '23503') {
    // Foreign key violation
    return createValidationError('Invalid reference to related resource');
  }
  
  if (error?.code === '42501') {
    // Insufficient privilege
    return createForbiddenError('You do not have permission to perform this action');
  }
  
  // Default to generic error
  return createErrorResponse(error, context);
}

