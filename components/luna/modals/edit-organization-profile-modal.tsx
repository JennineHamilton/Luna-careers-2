/**
 * Edit Organization Profile Modal
 * For editing organization information from the profile page
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

  // Initialize form data from organization when modal opens
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    organization_size: '',
    founded_year: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    city: '',
    state: '',
    country: '',
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

  // Update form data when organization changes or modal opens
  useEffect(() => {
    if (open && organization) {
      // Convert country and state names to ISO codes
      const countryCode = organization.country
        ? Country.getAllCountries().find(c => c.name === organization.country)?.isoCode || ''
        : '';

      const stateCode = organization.state && countryCode
        ? State.getStatesOfCountry(countryCode).find(s => s.name === organization.state)?.isoCode || ''
        : '';

      setFormData({
        name: organization.name || '',
        industry: organization.industry || '',
        organization_size: organization.organization_size || '',
        founded_year: organization.founded_year?.toString() || '',
        contact_email: organization.contact_email || '',
        contact_phone: organization.contact_phone || '',
        website_url: organization.website_url || '',
        city: organization.city || '',
        state: stateCode,
        country: countryCode,
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
      // Convert ISO codes back to names for API
      const countryName = formData.country
        ? Country.getAllCountries().find(c => c.isoCode === formData.country)?.name || ''
        : '';
      const stateName = formData.state && formData.country
        ? State.getStatesOfCountry(formData.country).find(s => s.isoCode === formData.state)?.name || ''
        : '';

      const response = await fetch(`/api/organization/profile?slug=${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: formData.industry || null,
          organization_size: formData.organization_size || null,
          founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
          contact_email: formData.contact_email || null,
          contact_phone: formData.contact_phone || null,
          website_url: formData.website_url || null,
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

              {/* Company Name (read-only) */}
              <LunaInput
                label="Company Name"
                value={formData.name}
                disabled
                helperText="Company name cannot be changed from this page"
              />

              {/* Industry */}
              <LunaSearchableSelect
                label="Industry"
                options={industryOptions}
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              />

              {/* Organization Size */}
              <LunaSearchableSelect
                label="Company Size"
                options={organizationSizeOptions}
                value={formData.organization_size}
                onValueChange={(value) => setFormData({ ...formData, organization_size: value })}
              />

              {/* Founded Year */}
              <LunaInput
                label="Founded Year"
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                placeholder="e.g., 2012"
              />

              {/* Contact Email */}
              <LunaInput
                label="Contact Email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@company.com"
              />

              {/* Contact Phone */}
              <LunaInput
                label="Contact Phone"
                type="tel"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />

              {/* Website */}
              <LunaInput
                label="Website"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://www.company.com"
              />

              {/* Location Fields */}
              <LunaSearchableSelect
                label="Country"
                options={countryOptions}
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value, state: '' })}
                placeholder="Select country"
              />

              {formData.country && stateOptions.length > 0 && (
                <LunaSearchableSelect
                  label="State/Province"
                  options={stateOptions}
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                  placeholder="Select state/province"
                />
              )}

              <LunaInput
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City name"
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
