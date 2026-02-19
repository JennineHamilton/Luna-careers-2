'use client';

import { useEffect } from 'react';
import { logError } from '@/lib/utils/error-logger';

/**
 * Global Error Boundary for the root layout
 * This catches errors that occur in the root layout itself
 *
 * Note: This must be a minimal implementation as it replaces the entire root layout
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, {
      action: 'global-error-boundary',
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#111827',
              marginBottom: '1rem',
            }}>
              Something went wrong
            </h1>

            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              We encountered a critical error. Please try refreshing the page.
            </p>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f3f4f6',
                borderRadius: '0.5rem',
                textAlign: 'left',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#374151',
                  wordBreak: 'break-word',
                }}>
                  {error.message}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Try Again
              </button>

              <button
                onClick={() => window.location.href = '/'}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Go Home
              </button>
            </div>

            {error.digest && (
              <p style={{
                fontSize: '0.75rem',
                color: '#9ca3af',
                marginTop: '1.5rem',
              }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}

