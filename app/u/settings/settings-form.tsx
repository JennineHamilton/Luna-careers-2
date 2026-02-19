'use client';

import { useState } from 'react';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import { LunaCard } from '@/components/luna/card';
import { LunaInput } from '@/components/luna/input';
import { LunaButton } from '@/components/luna/button';
import { LunaTextarea } from '@/components/luna/textarea';
import { updatePassword } from '@/lib/auth/actions';
import type { Database } from '@/types/database.types';

type UserProfile = Database['public']['Tables']['users']['Row'];

interface UserSettingsFormProps {
  initialProfile: UserProfile;
}

export function UserSettingsForm({ initialProfile }: UserSettingsFormProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState(initialProfile.first_name || '');
  const [lastName, setLastName] = useState(initialProfile.last_name || '');
  const [phone, setPhone] = useState(initialProfile.phone || '');
  const [bio, setBio] = useState(initialProfile.bio || '');
  const [location, setLocation] = useState(initialProfile.location || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialProfile.linkedin_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(initialProfile.portfolio_url || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
          bio,
          location,
          linkedin_url: linkedinUrl,
          portfolio_url: portfolioUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update profile');
        setIsSaving(false);
        return;
      }

      setProfile(data.profile);
      setSuccess('Profile updated successfully!');
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await updatePassword(currentPassword, newPassword);

      if (!result.success) {
        setPasswordError(result.error || 'Failed to update password');
        setIsUpdatingPassword(false);
        return;
      }

      setPasswordSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsUpdatingPassword(false);
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError('Failed to update password');
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900">Settings</h1>
        <p className="text-luna-gray-600 mt-1">
          Manage your account preferences and security
        </p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Profile Settings */}
        <LunaCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center">
                <User className="w-5 h-5 text-luna-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-luna-gray-900">
                  Profile Settings
                </h2>
                <p className="text-sm text-luna-gray-600">
                  Update your personal information
                </p>
              </div>
            </div>

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LunaInput label="First Name" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <LunaInput label="Last Name" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
              <LunaInput label="Email Address" type="email" value={profile?.email || ''} disabled helperText="Email cannot be changed" />
              <LunaInput label="Phone Number" type="tel" placeholder="+1 (555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <LunaInput label="Location" placeholder="City, Country" value={location} onChange={(e) => setLocation(e.target.value)} />
              <LunaTextarea label="Bio" placeholder="Tell us about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
              <LunaInput label="LinkedIn URL" type="url" placeholder="https://linkedin.com/in/yourprofile" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
              <LunaInput label="Portfolio URL" type="url" placeholder="https://yourportfolio.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              <div className="flex justify-end">
                <LunaButton type="submit" variant="primary" loading={isSaving}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </LunaButton>
              </div>
            </form>
          </div>
        </LunaCard>

        {/* Security Settings */}
        <LunaCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-luna-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-luna-gray-900">Security</h2>
                <p className="text-sm text-luna-gray-600">Update your password</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{passwordSuccess}</p>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{passwordError}</p>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <LunaInput label="Current Password" type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <LunaInput label="New Password" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <LunaInput label="Confirm New Password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              <div className="flex justify-end">
                <LunaButton type="submit" variant="primary" loading={isUpdatingPassword}>
                  <Lock className="w-4 h-4" />
                  Update Password
                </LunaButton>
              </div>
            </form>
          </div>
        </LunaCard>
      </div>
    </div>
  );
}

