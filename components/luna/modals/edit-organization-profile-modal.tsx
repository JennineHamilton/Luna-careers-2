/**
 * Edit Organization Profile Modal
 * For editing organization information from the profile page
 * Compact layout: 5 rows of fields including description.
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
  LunaTextarea,
  LunaSearchableSelect,
} from '@/components/luna';
import { Loader2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Country, State } from 'country-state-city';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];

interface EditOrganizationProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  slug: string;
  onSuccess?: () => void;
}

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'non_profit', label: 'Non-Profit' },
  { value: 'other', label: 'Other' },
];

const organizationSizeOptions = [
  { value: 'startup', label: '1-10 Employees' },
  { value: 'small', label: '11-50 Employees' },
  { value: 'medium', label: '51-200 Employees' },
  { value: 'large', label: '201-1000 Employees' },
  { value: 'enterprise', label: '1000+ Employees' },
];

const HTTPS_PREFIX = 'https://';

export function EditOrganizationProfileModal({
  open,
  onOpenChange,
  organization,
  slug,
  onSuccess,
}: EditOrganizationProfileModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    organization_size: '',
    founded_year: '',
    contact_email: '',
    contact_phone: '',
    phone_country_code: '+1',
    website_path: '', // Without https://
    city: '',
    state: '',
    country: '',
    description: '',
  });

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

  useEffect(() => {
    if (open && organization) {
      const countryCode = organization.country
        ? Country.getAllCountries().find(c => c.name === organization.country)?.isoCode || ''
        : '';
      const statesForCountry = countryCode ? State.getStatesOfCountry(countryCode) : [];
      const stateCode =
        organization.state && statesForCountry.length > 0
          ? statesForCountry.find(s => s.name === organization.state)?.isoCode || ''
          : '';
      const stateValue = statesForCountry.length > 0 ? stateCode : (organization.state || '');
      const websiteUrl = organization.website_url || '';
      const websitePath = websiteUrl.replace(/^https?:\/\//, '');

      // Extract country code from phone if present (e.g., "+1 (555) 123-4567" -> "+1")
      const phone = organization.contact_phone || '';
      const phoneCountryCode = phone.startsWith('+') ? phone.split(' ')[0] || '+1' : '+1';

      setFormData({
        name: organization.name || '',
        industry: organization.industry || '',
        organization_size: organization.organization_size || '',
        founded_year: organization.founded_year?.toString() || '',
        contact_email: organization.contact_email || '',
        contact_phone: phone,
        phone_country_code: phoneCountryCode,
        website_path: websitePath,
        city: organization.city || '',
        state: stateValue,
        country: countryCode,
        description: organization.description || organization.bio || '',
      });
      setError('');
    }
  }, [open, organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    setError('');
    setLoading(true);

    try {
      const countryName = formData.country
        ? Country.getAllCountries().find(c => c.isoCode === formData.country)?.name || ''
        : '';
      const stateName =
        formData.country && stateOptions.length > 0 && formData.state
          ? State.getStatesOfCountry(formData.country).find(s => s.isoCode === formData.state)?.name || ''
          : (formData.state || '');
      const website_url = formData.website_path.trim()
        ? (formData.website_path.startsWith('http') ? formData.website_path : `${HTTPS_PREFIX}${formData.website_path.trim()}`)
        : null;

      const response = await fetch(`/api/organization/profile?slug=${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description || null,
          industry: formData.industry || null,
          organization_size: formData.organization_size || null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          website_url,
          city: formData.city || null,
          state: stateName || null,
          country: countryName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update organization');
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error updating organization:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Edit Company Information
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update your company's basic information and contact details
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

              {/* Row 1: Company Name */}
              <LunaInput
                label="Company Name"
                value={formData.name}
                disabled
                helperText="Company name cannot be changed from this page"
              />

              {/* Row 2: Industry, Company Size, Founded Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LunaSearchableSelect
                  label="Industry"
                  options={industryOptions}
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                />
                <LunaSearchableSelect
                  label="Company Size"
                  options={organizationSizeOptions}
                  value={formData.organization_size}
                  onValueChange={(value) => setFormData({ ...formData, organization_size: value })}
                />
                <LunaInput
                  label="Founded Year"
                  type="number"
                  value={formData.founded_year}
                  onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                  placeholder="e.g., 2012"
                />
              </div>

              {/* Row 3: Contact Email, Contact Phone, Website (with https:// prefix) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LunaInput
                  label="Contact Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="contact@company.com"
                />
                <LunaInput
                  label="Contact Phone"
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  countryCode={formData.phone_country_code}
                  onCountryCodeChange={(code) => setFormData({ ...formData, phone_country_code: code })}
                />
                <div>
                  <label className="block text-sm font-medium text-luna-gray-700 mb-1.5">
                    Website
                  </label>
                  <div className="flex rounded-md border border-luna-border-default bg-white focus-within:ring-2 focus-within:ring-luna-blue focus-within:border-luna-blue">
                    <span className="inline-flex items-center px-3 text-sm text-luna-gray-500 border-r border-luna-border-default bg-luna-gray-50 rounded-l-md">
                      https://
                    </span>
                    <input
                      type="text"
                      value={formData.website_path}
                      onChange={(e) => setFormData({ ...formData, website_path: e.target.value })}
                      placeholder="www.company.com"
                      className="flex-1 min-w-0 rounded-r-md border-0 py-2 px-3 text-sm text-luna-gray-900 placeholder:text-luna-gray-400 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Country, State, City */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LunaSearchableSelect
                  label="Country"
                  options={countryOptions}
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value, state: '' })}
                  placeholder="Select country"
                />
                {formData.country && stateOptions.length > 0 ? (
                  <LunaSearchableSelect
                    label="State/Province"
                    options={stateOptions}
                    value={formData.state}
                    onValueChange={(value) => setFormData({ ...formData, state: value })}
                    placeholder="Select state/province"
                  />
                ) : (
                  <LunaInput
                    label="State/Province"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="State or province"
                  />
                )}
                <LunaInput
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City name"
                />
              </div>

              {/* Row 5: Description */}
              <LunaTextarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell prospects about your company, its mission, and values..."
                rows={4}
              />
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
