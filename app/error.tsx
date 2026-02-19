'use client';

import { useEffect } from 'react';
import { LunaButton } from '@/components/luna/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logError } from '@/lib/utils/error-logger';

/**
 * Global Error Boundary for the application
 * Catches errors in the app directory and provides a user-friendly error UI
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(error, {
      action: 'error-boundary',
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-luna-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-luna-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-luna-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-luna-gray-900 mb-2">
          Something went wrong
        </h1>

        <p className="text-luna-gray-600 mb-6">
          We encountered an unexpected error. This has been logged and we'll look into it.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-luna-gray-100 rounded-lg text-left">
            <p className="text-xs font-mono text-luna-gray-700 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-luna-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <LunaButton
            onClick={reset}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </LunaButton>

          <LunaButton
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </LunaButton>
        </div>

        {error.digest && process.env.NODE_ENV === 'production' && (
          <p className="text-xs text-luna-gray-500 mt-6">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

