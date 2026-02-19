'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { LunaButton, LunaInput } from '@/components/luna';
import AuthLayout from '@/components/layout/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && success) {
      setCanResend(true);
    }
  }, [countdown, success]);

  const sendResetEmail = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Call the new API endpoint that uses MailGun
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setCountdown(60); // 60 second countdown
      setCanResend(false);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetEmail();
  };

  const handleResend = async () => {
    await sendResetEmail();
  };

  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-navy mb-1">
          Reset your password
        </h1>
        <p className="text-luna-gray-500 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Success Message */}
      {success ? (
        <div>
          <div className="mb-5 flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-green-800 mb-1">
                Check your email for a password reset link. If you don&apos;t see it,
                check your spam folder.
              </p>
              <p className="text-xs text-green-700">
                Email sent to: <strong>{email}</strong>
              </p>
            </div>
          </div>

          {/* Resend button with countdown */}
          <div className="mb-4">
            {canResend ? (
              <LunaButton
                variant="secondary"
                fullWidth
                onClick={handleResend}
                loading={isLoading}
              >
                Resend reset link
              </LunaButton>
            ) : (
              <p className="text-sm text-luna-gray-500 text-center">
                Didn&apos;t receive the email?{' '}
                <span className="text-luna-gray-400">
                  Resend available in {countdown}s
                </span>
              </p>
            )}
          </div>

          <Link href="/login">
            <LunaButton variant="primary" fullWidth>
              Back to sign in
            </LunaButton>
          </Link>
        </div>
      ) : (
        <>
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

            <LunaButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
            >
              Send reset link
            </LunaButton>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-luna-blue hover:text-luna-navy transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}

