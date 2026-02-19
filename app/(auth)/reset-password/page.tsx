'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Check, X } from 'lucide-react';
import { LunaButton, LunaInput } from '@/components/luna';
import AuthLayout from '@/components/layout/AuthLayout';
import { validatePasswordStrength, passwordsMatch } from '@/lib/utils/password';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const passwordValidation = validatePasswordStrength(password);
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);

  // Check if token exists in URL
  useEffect(() => {
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      // No token, redirect to forgot password
      router.push('/forgot-password?error=Invalid or missing reset token');
      return;
    }

    setToken(tokenParam);
    setTokenChecked(true);
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    // Validate password strength
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    // Validate passwords match
    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Call the API endpoint to reset password
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update password');
        setIsLoading(false);
        return;
      }

      // Success! Redirect to login
      router.push('/login?message=Password updated successfully. Please log in with your new password.');
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  // Show loading state while checking token
  if (!tokenChecked) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-luna-gray-500 text-sm">Verifying reset link...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-navy mb-1">
          Set new password
        </h1>
        <p className="text-luna-gray-500 text-sm">
          Enter your new password below
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <LunaInput
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {/* Password requirements */}
          {password.length > 0 && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {[
                { met: password.length >= 8, label: '8+ characters' },
                { met: /[A-Z]/.test(password), label: 'Uppercase letter' },
                { met: /[a-z]/.test(password), label: 'Lowercase letter' },
                { met: /[0-9]/.test(password), label: 'Number' },
              ].map((req) => (
                <div
                  key={req.label}
                  className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-luna-blue' : 'text-luna-gray-300'}`}
                >
                  {req.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <LunaInput
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />
          {confirmPassword.length > 0 && (
            <p className={`text-xs mt-1.5 ${doPasswordsMatch ? 'text-luna-blue' : 'text-red-400'}`}>
              {doPasswordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        <LunaButton
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
        >
          Update password
        </LunaButton>
      </form>
    </AuthLayout>
  );
}

function ResetPasswordLoading() {
  return (
    <AuthLayout>
      <div className="mb-6">
        <div className="h-7 bg-luna-gray-100 animate-pulse rounded w-48 mb-2" />
        <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-56" />
      </div>
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-24 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-36 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
