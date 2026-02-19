/**
 * Centralized Error Logging Utility
 * Provides consistent error logging across the application.
 *
 * To enable Sentry (or another service), install the SDK and uncomment the
 * captureException body below. Every call to logError() will then automatically
 * forward errors to the tracking service — no other files need to change.
 *
 * Setup steps:
 *   1. npm install @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs
 *   3. Uncomment the Sentry.captureException call in captureException() below
 */

export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  route?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

export interface LoggedError {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
  environment: string;
}

/**
 * Send an error to the external error tracking service.
 * Currently a no-op — uncomment the Sentry call once the SDK is installed.
 */
function captureException(error: Error, context?: ErrorContext): void {
  // import * as Sentry from '@sentry/nextjs';
  // Sentry.captureException(error, {
  //   tags: { route: context?.route, action: context?.action },
  //   user: context?.userId ? { id: context.userId } : undefined,
  //   extra: context?.metadata,
  // });
}

/**
 * Log an error with context
 * In development: logs to console
 * In production: sends to error tracking service and logs minimal info
 */
export function logError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const loggedError: LoggedError = {
    message: errorMessage,
    stack: errorStack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Development: Log to console with full details
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 Error:', errorMessage);
    if (context) {
      console.error('📍 Context:', context);
    }
    if (errorStack) {
      console.error('📚 Stack:', errorStack);
    }
  }

  // Production: Send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    captureException(error instanceof Error ? error : new Error(errorMessage), context);
    console.error('[Error]', errorMessage, context?.route || '');
  }
}

/**
 * Log a warning (non-critical issue)
 */
export function logWarning(
  message: string,
  context?: ErrorContext
): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Warning:', message);
    if (context) {
      console.warn('📍 Context:', context);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('[Warning]', message, context?.route || '');
  }
}

/**
 * Log an info message (for debugging)
 */
export function logInfo(
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('ℹ️ Info:', message);
    if (metadata) {
      console.log('📊 Data:', metadata);
    }
  }

  // Don't log info messages in production to reduce noise
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
  error: Error | unknown,
  statusCode: number = 500,
  context?: ErrorContext
): {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
} {
  // Log the error
  logError(error, context);

  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

  return {
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? errorMessage 
      : 'An error occurred while processing your request',
    statusCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safely execute an async function with error handling
 * Returns [data, error] tuple
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<[T | null, Error | null]> {
  try {
    const data = await fn();
    return [data, null];
  } catch (error) {
    logError(error, context);
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
}

