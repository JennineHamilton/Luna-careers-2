'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Check, X } from 'lucide-react';
import { LunaButton, LunaInput } from '@/components/luna';
import AuthLayout from '@/components/layout/AuthLayout';
import { validatePasswordStrength, passwordsMatch } from '@/lib/utils/password';

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordValidation = validatePasswordStrength(password);
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      // Use custom signup API that sends email via MailGun
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Redirect to login with success message
      router.push('/login?message=Account created! Please check your email to confirm your account.');
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
          Create your account
        </h1>
        <p className="text-luna-gray-500 text-sm">
          Join Luna Careers to unlock opportunities
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LunaInput
            label="First Name"
            type="text"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />

          <LunaInput
            label="Last Name"
            type="text"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>

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
            label="Confirm Password"
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
          Create account
        </LunaButton>
      </form>

      {/* Terms */}
      <p className="text-xs text-luna-gray-400 text-center mt-4">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="text-luna-blue hover:text-luna-navy transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-luna-blue hover:text-luna-navy transition-colors">
          Privacy Policy
        </Link>
      </p>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-luna-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white text-luna-gray-400">
            Already have an account?
          </span>
        </div>
      </div>

      {/* Sign In Link */}
      <Link href="/login">
        <LunaButton variant="outline" fullWidth>
          Sign in
        </LunaButton>
      </Link>
    </AuthLayout>
  );
}

