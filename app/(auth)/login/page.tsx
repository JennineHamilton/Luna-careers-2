'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { login } from '@/lib/auth/actions';
import { LunaButton, LunaInput } from '@/components/luna';
import AuthLayout from '@/components/layout/AuthLayout';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');
  const message = searchParams.get('message');
  const errorParam = searchParams.get('error');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(errorParam);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await login({
        email,
        password,
        redirectTo: redirectTo || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Failed to sign in');
        setIsLoading(false);
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-navy mb-1">
          Welcome back
        </h1>
        <p className="text-luna-gray-500 text-sm">
          Sign in to your account to continue
        </p>
      </div>

      {/* Success Message */}
      {message && (
        <div className="mb-5 flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{message}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <LunaInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div>
          <LunaInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-2">
            <Link
              href="/forgot-password"
              className="text-xs text-luna-blue hover:text-luna-navy transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <LunaButton
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
        >
          Sign in
        </LunaButton>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-luna-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-luna-gray-400">
            Don&apos;t have an account?
          </span>
        </div>
      </div>

      {/* Sign Up Link */}
      <Link href="/signup">
        <LunaButton variant="outline" fullWidth>
          Create an account
        </LunaButton>
      </Link>
    </AuthLayout>
  );
}

function LoginLoading() {
  return (
    <AuthLayout>
      <div className="mb-8">
        <div className="h-7 bg-luna-gray-100 animate-pulse rounded w-40 mb-2" />
        <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-56" />
      </div>
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-12 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-16 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
