/**
 * Edit Profile Modal
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaInput,
  LunaSearchableSelect,
  LunaTextarea,
} from '@/components/luna';
import { Loader2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Country, State } from 'country-state-city';
import type { Database } from '@/types/database.types';

type Profile = Database['public']['Tables']['users']['Row'];

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
}

export function EditProfileModal({ open, onOpenChange, profile }: EditProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data from profile when modal opens
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    profession: '',
    bio: '',
    email: '',
    phone: '',
    phone_country_code: '+1',
    city: '',
    state: '', // ISO code
    country: 'US', // ISO code
  });

  // Country and state options
  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
  }, []);

  const stateOptions = useMemo(() => {
    if (!formData.country) return [];
    return State.getStatesOfCountry(formData.country).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [formData.country]);

  // Update form data when profile changes or modal opens
  useEffect(() => {
    if (open && profile) {
      // Convert country and state names to ISO codes
      const countryCode = profile.country
        ? Country.getAllCountries().find(c => c.name === profile.country)?.isoCode || 'US'
        : 'US';

      const stateCode = profile.state && countryCode
        ? State.getStatesOfCountry(countryCode).find(s => s.name === profile.state)?.isoCode || ''
        : '';

      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        profession: profile.profession || '',
        bio: profile.bio || '',
        email: profile.email || '',
        phone: profile.phone || '',
        phone_country_code: '+1', // Default, could be stored in DB later
        city: profile.city || '',
        state: stateCode,
        country: countryCode,
      });
      setError('');
    }
  }, [open, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setError('');
    setLoading(true);

    try {
      // Convert ISO codes to names for storage
      const countryName = formData.country
        ? Country.getCountryByCode(formData.country)?.name || formData.country
        : '';
      const stateName = formData.state && formData.country
        ? State.getStateByCodeAndCountry(formData.state, formData.country)?.name || formData.state
        : '';

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          profession: formData.profession,
          bio: formData.bio,
          phone: formData.phone,
          city: formData.city,
          state: stateName,
          country: countryName,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update profile');
      }

      setLoading(false);
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Edit Profile
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update your profile information and settings
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-luna-red-50 border border-luna-red-200 rounded-lg text-sm text-luna-red-700">
                  {error}
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="First Name"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="John"
                />
                <LunaInput
                  label="Last Name"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              {/* Profession */}
              <LunaInput
                label="Profession"
                value={formData.profession}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="e.g., Digital Solutions Architect"
              />

              {/* Bio */}
              <LunaTextarea
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell employers about yourself..."
                rows={3}
                maxLength={250}
                showCount
                helperText="Keep it brief - 3 lines max for best display across devices"
              />

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john.doe@example.com"
                />
                <LunaInput
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  countryCode={formData.phone_country_code}
                  onCountryCodeChange={(code) => setFormData({ ...formData, phone_country_code: code })}
                />
              </div>

              {/* Country + State + City */}
              <div className="grid grid-cols-3 gap-4">
                <LunaSearchableSelect
                  label="Country"
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  options={countryOptions}
                  value={formData.country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, country: value, state: '', city: '' });
                  }}
                />
                <LunaSearchableSelect
                  label="State/Province"
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                  options={stateOptions}
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                  disabled={!formData.country}
                  emptyMessage={formData.country ? 'No states found' : 'Select a country first'}
                />
                <LunaInput
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
            </div>
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton type="submit" variant="primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

