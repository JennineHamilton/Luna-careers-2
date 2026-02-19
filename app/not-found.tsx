'use client';

import Link from 'next/link';
import { LunaButton } from '@/components/luna/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

/**
 * Global 404 Not Found Page
 * Shown when a route doesn't exist
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-luna-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-luna-purple-600 mb-2">404</h1>
          <div className="w-24 h-1 bg-luna-purple-600 mx-auto rounded-full"></div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-luna-gray-900 mb-4">
          Page Not Found
        </h2>
        <p className="text-luna-gray-600 mb-8">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <LunaButton
              variant="primary"
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              Go Home
            </LunaButton>
          </Link>

          <LunaButton
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </LunaButton>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-luna-gray-200">
          <p className="text-sm text-luna-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            <Link href="/u/dashboard" className="text-luna-purple-600 hover:text-luna-purple-700 hover:underline">
              Personal Dashboard
            </Link>
            <span className="text-luna-gray-300">•</span>
            <Link href="/org/dashboard" className="text-luna-purple-600 hover:text-luna-purple-700 hover:underline">
              Organization Portal
            </Link>
            <span className="text-luna-gray-300">•</span>
            <Link href="/cmd/dashboard" className="text-luna-purple-600 hover:text-luna-purple-700 hover:underline">
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

