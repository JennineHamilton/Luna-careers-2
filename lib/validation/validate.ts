/**
 * Validation Utilities
 * Helper functions for validating request data with Zod
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Validate request body against a Zod schema
 * Returns validated data or error response
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    // JSON parsing error
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate query parameters against a Zod schema
 * Returns validated data or error response
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const { searchParams } = request.nextUrl;
    const params = Object.fromEntries(searchParams.entries());
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid query parameters',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid query parameters' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Validate route parameters against a Zod schema
 * Returns validated data or error response
 */
export function validateParams<T>(
  params: any,
  schema: z.ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid route parameters',
            details: error.issues.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      error: NextResponse.json(
        { error: 'Invalid route parameters' },
        { status: 400 }
      ),
    };
  }
}

/**
 * Sanitize string input to prevent XSS
 * Removes potentially dangerous HTML/script tags
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
}

