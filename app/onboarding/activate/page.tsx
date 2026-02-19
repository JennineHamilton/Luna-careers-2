/**
 * Onboarding Activation Page
 * User enters temporary password to activate account
 */

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { LunaButton, LunaInput } from '@/components/luna';
import AuthLayout from '@/components/layout/AuthLayout';

function ActivateAccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid activation link. Please check your email and try again.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate the token and temporary password
      const response = await fetch('/api/onboarding/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          temporary_password: temporaryPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid credentials. Please check your email and temporary password.');
        setLoading(false);
        return;
      }

      // Store token in session storage for next step
      if (token) {
        sessionStorage.setItem('activation_token', token);
      }
      sessionStorage.setItem('activation_email', email);

      // Redirect to password setup
      router.push('/onboarding/set-password');
    } catch (err) {
      console.error('Activation error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          Invalid activation link. Please check your email and try again.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <LunaInput
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
        autoComplete="email"
      />

      <div>
        <LunaInput
          label="Temporary Password"
          type="text"
          placeholder="Enter the password from your email"
          value={temporaryPassword}
          onChange={(e) => setTemporaryPassword(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-xs text-luna-gray-400 mt-1.5">
          Check your email for the temporary password
        </p>
      </div>

      <LunaButton
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
      >
        Continue
      </LunaButton>
    </form>
  );
}

function ActivateLoading() {
  return (
    <AuthLayout>
      <div className="mb-6">
        <div className="h-7 bg-luna-gray-100 animate-pulse rounded w-48 mb-2" />
        <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-64" />
      </div>
      <div className="space-y-4">
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-24 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div>
          <div className="h-4 bg-luna-gray-100 animate-pulse rounded w-32 mb-1.5" />
          <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
        </div>
        <div className="h-10 bg-luna-gray-100 animate-pulse rounded" />
      </div>
    </AuthLayout>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<ActivateLoading />}>
      <AuthLayout>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-luna-navy mb-1">
            Activate Your Account
          </h1>
          <p className="text-luna-gray-500 text-sm">
            Enter your email and the temporary password sent to you
          </p>
        </div>

        <ActivateAccountForm />
      </AuthLayout>
    </Suspense>
  );
}

