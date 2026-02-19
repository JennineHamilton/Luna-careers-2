/**
 * Onboarding Set Password Page
 * User creates their permanent password
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Check, X } from 'lucide-react';
import { LunaButton, LunaInput } from '@/components/luna';
import { validatePasswordStrength, passwordsMatch } from '@/lib/utils/password';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/layout/AuthLayout';

export default function SetPasswordPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const passwordValidation = validatePasswordStrength(password);
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);
  
  const [token, setToken] = useState('');

  useEffect(() => {
    // Check if user came from activation page
    const storedEmail = sessionStorage.getItem('activation_email');
    const storedToken = sessionStorage.getItem('activation_token');
    if (!storedEmail || !storedToken) {
      router.push('/login');
      return;
    }
    setEmail(storedEmail);
    setToken(storedToken);
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors[0]);
      return;
    }
    
    if (!doPasswordsMatch) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/onboarding/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          token,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to set password');
        setLoading(false);
        return;
      }
      
      // Clear session storage
      sessionStorage.removeItem('activation_token');
      sessionStorage.removeItem('activation_email');

      // Wait a moment for Supabase to process the password update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Auto-sign in the user with their new credentials
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign-in error:', signInError);
        // If auto-sign-in fails, fall back to login page
        router.push('/login?message=Password set successfully. Please log in.');
        return;
      }

      // Redirect to the appropriate dashboard
      const redirectTo = data.redirect_to || '/u/dashboard';
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      console.error('Set password error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <AuthLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-luna-navy mb-1">
          Set Your Password
        </h1>
        <p className="text-luna-gray-500 text-sm">
          Choose a strong password for your account
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
        <LunaInput
          label="Email Address"
          type="email"
          value={email}
          disabled
          className="bg-luna-gray-50"
        />

        <div>
          <LunaInput
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
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
            disabled={loading}
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
          loading={loading}
          disabled={!passwordValidation.valid || !doPasswordsMatch}
        >
          Complete Setup
        </LunaButton>
      </form>
    </AuthLayout>
  );
}

