/**
 * Edit Organization Modal
 * For editing organization information (platform admin only)
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
  LunaSelect,
  LunaSelectItem,
  LunaSearchableSelect,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Country, State } from 'country-state-city';

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  organization: {
    id: string;
    name: string;
    industry?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    street_address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
  } | null;
}

export function EditOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
  organization,
}: EditOrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Organization data - exact same structure as create modal
  const [orgData, setOrgData] = useState({
    name: '',
    industry: '',
    contact_email: '',
    contact_phone: '',
    contact_phone_country_code: '+1',
    street_address: '',
    city: '',
    state: '',
    country: 'US', // ISO code for country-state-city library
  });

  // Country and state options
  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
  }, []);

  const stateOptions = useMemo(() => {
    if (!orgData.country) return [];
    return State.getStatesOfCountry(orgData.country).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [orgData.country]);

  // Update form when organization prop changes
  useEffect(() => {
    if (organization) {
      // Find country and state ISO codes from names
      const countryObj = organization.country
        ? Country.getAllCountries().find(c => c.name === organization.country)
        : null;
      const countryCode = countryObj?.isoCode || 'US';

      let stateCode = '';
      if (countryCode && organization.state) {
        const stateObj = State.getStatesOfCountry(countryCode).find(s => s.name === organization.state);
        stateCode = stateObj?.isoCode || '';
      }

      // Extract country code from phone number if it starts with +
      let phoneCountryCode = '+1';
      let phoneNumber = organization.contact_phone || '';
      if (phoneNumber.startsWith('+')) {
        const match = phoneNumber.match(/^(\+\d{1,3})\s?(.*)$/);
        if (match) {
          phoneCountryCode = match[1];
          phoneNumber = match[2];
        }
      }

      setOrgData({
        name: organization.name || '',
        industry: organization.industry || '',
        contact_email: organization.contact_email || '',
        contact_phone: phoneNumber,
        contact_phone_country_code: phoneCountryCode,
        street_address: organization.street_address || '',
        city: organization.city || '',
        state: stateCode,
        country: countryCode,
      });
    }
  }, [organization]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('You must be logged in');
        setLoading(false);
        return;
      }

      // Get country and state names from ISO codes
      const countryName = orgData.country
        ? Country.getCountryByCode(orgData.country)?.name || orgData.country
        : '';
      const stateName = orgData.state && orgData.country
        ? State.getStateByCodeAndCountry(orgData.state, orgData.country)?.name || orgData.state
        : '';

      // Format phone number with country code
      const fullPhoneNumber = orgData.contact_phone
        ? `${orgData.contact_phone_country_code} ${orgData.contact_phone}`
        : '';

      const response = await fetch('/api/admin/organizations/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organization_id: organization.id,
          name: orgData.name,
          industry: orgData.industry || null,
          contact_email: orgData.contact_email,
          contact_phone: fullPhoneNumber,
          street_address: orgData.street_address,
          city: orgData.city,
          state: stateName,
          country: countryName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update organization');
        setLoading(false);
        return;
      }

      // Success
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!loading) {
      setError('');
      onOpenChange(false);
    }
  };
  
  if (!organization) return null;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-luna-blue" />
            Edit Organization
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update organization information
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organization Name */}
            <LunaInput
              label="Organization Name"
              required
              value={orgData.name}
              onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              placeholder="Acme Corporation"
            />

            {/* Industry */}
            <LunaSelect
              label="Industry"
              required
              value={orgData.industry}
              onValueChange={(value) => setOrgData({ ...orgData, industry: value })}
              placeholder="Select industry"
            >
              <LunaSelectItem value="technology">Technology</LunaSelectItem>
              <LunaSelectItem value="healthcare">Healthcare</LunaSelectItem>
              <LunaSelectItem value="finance">Finance</LunaSelectItem>
              <LunaSelectItem value="education">Education</LunaSelectItem>
              <LunaSelectItem value="retail">Retail</LunaSelectItem>
              <LunaSelectItem value="manufacturing">Manufacturing</LunaSelectItem>
              <LunaSelectItem value="other">Other</LunaSelectItem>
            </LunaSelect>

            {/* Contact Email + Phone */}
            <div className="grid grid-cols-2 gap-4">
              <LunaInput
                label="Contact Email"
                type="email"
                required
                value={orgData.contact_email}
                onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })}
                placeholder="contact@example.com"
              />

              <LunaInput
                label="Contact Phone"
                type="tel"
                required
                value={orgData.contact_phone}
                onChange={(e) => setOrgData({ ...orgData, contact_phone: e.target.value })}
                placeholder="(555) 123-4567"
                countryCode={orgData.contact_phone_country_code}
                onCountryCodeChange={(code) => setOrgData({ ...orgData, contact_phone_country_code: code })}
              />
            </div>

            {/* Street Address */}
            <LunaInput
              label="Street Address"
              required
              value={orgData.street_address}
              onChange={(e) => setOrgData({ ...orgData, street_address: e.target.value })}
              placeholder="123 Main Street, Suite 100"
            />

            {/* Country + State + City */}
            <div className="grid grid-cols-3 gap-4">
              <LunaSearchableSelect
                label="Country"
                required
                placeholder="Select country"
                searchPlaceholder="Search countries..."
                options={countryOptions}
                value={orgData.country}
                onValueChange={(value) => {
                  setOrgData({ ...orgData, country: value, state: '', city: '' });
                }}
              />

              <LunaSearchableSelect
                label="State/Province"
                required
                placeholder="Select state"
                searchPlaceholder="Search states..."
                options={stateOptions}
                value={orgData.state}
                onValueChange={(value) => setOrgData({ ...orgData, state: value })}
                disabled={!orgData.country}
                emptyMessage={orgData.country ? 'No states found' : 'Select a country first'}
              />

              <LunaInput
                label="City"
                required
                value={orgData.city}
                onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>
          </form>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !orgData.name}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Organization'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

