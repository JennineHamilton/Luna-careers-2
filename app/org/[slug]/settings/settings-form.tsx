'use client';

import { useState } from 'react';
import { Building2, Save } from 'lucide-react';
import { LunaCard } from '@/components/luna/card';
import { LunaInput } from '@/components/luna/input';
import { LunaButton } from '@/components/luna/button';
import { LunaTextarea } from '@/components/luna/textarea';
import { LunaSelect, LunaSelectItem } from '@/components/luna/select';
import type { Database } from '@/types/database.types';

type Organization = Database['public']['Tables']['organizations']['Row'];

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'finance', label: 'Finance' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'construction', label: 'Construction' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'energy', label: 'Energy' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'media', label: 'Media' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'legal', label: 'Legal' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'nonprofit', label: 'Non-Profit' },
  { value: 'government', label: 'Government' },
  { value: 'other', label: 'Other' },
];

const ORGANIZATION_SIZES = [
  { value: 'startup', label: 'Startup (1-10 employees)' },
  { value: 'small', label: 'Small (11-50 employees)' },
  { value: 'medium', label: 'Medium (51-200 employees)' },
  { value: 'large', label: 'Large (201-1000 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' },
];

interface OrgSettingsFormProps {
  initialOrganization: Organization;
  slug: string;
}

export function OrgSettingsForm({ initialOrganization, slug }: OrgSettingsFormProps) {
  const [organization, setOrganization] = useState<Organization>(initialOrganization);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const socialLinks = initialOrganization.social_links as { linkedin?: string; twitter?: string } || {};

  const [description, setDescription] = useState(initialOrganization.description || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialOrganization.website_url || '');
  const [industry, setIndustry] = useState(initialOrganization.industry || '');
  const [organizationSize, setOrganizationSize] = useState(initialOrganization.organization_size || '');
  const [foundedYear, setFoundedYear] = useState(initialOrganization.founded_year?.toString() || '');
  const [employeeCount, setEmployeeCount] = useState(initialOrganization.employee_count?.toString() || '');
  const [streetAddress, setStreetAddress] = useState(initialOrganization.street_address || '');
  const [city, setCity] = useState(initialOrganization.city || '');
  const [state, setState] = useState(initialOrganization.state || '');
  const [country, setCountry] = useState(initialOrganization.country || '');
  const [contactEmail, setContactEmail] = useState(initialOrganization.contact_email || '');
  const [contactPhone, setContactPhone] = useState(initialOrganization.contact_phone || '');
  const [linkedinUrl, setLinkedinUrl] = useState(socialLinks.linkedin || '');
  const [twitterUrl, setTwitterUrl] = useState(socialLinks.twitter || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/organization/profile?slug=${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          website_url: websiteUrl,
          industry: industry || null,
          organization_size: organizationSize || null,
          founded_year: foundedYear ? parseInt(foundedYear) : null,
          employee_count: employeeCount ? parseInt(employeeCount) : null,
          street_address: streetAddress,
          city,
          state,
          country,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          social_links: { linkedin: linkedinUrl, twitter: twitterUrl },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update organization');
        setIsSaving(false);
        return;
      }

      setOrganization(data.organization);
      setSuccess('Organization profile updated successfully!');
      setIsSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update organization');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-luna-gray-900">Organization Settings</h1>
        <p className="text-luna-gray-600 mt-1">Manage your organization profile and information</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        <LunaCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-md bg-luna-blue/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-luna-blue" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-luna-gray-900">Organization Profile</h2>
                <p className="text-sm text-luna-gray-600">Update your organization information</p>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <LunaInput label="Organization Name" value={organization?.name || ''} disabled helperText="Organization name cannot be changed" />

              <LunaTextarea label="Description" placeholder="Tell us about your organization..." value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LunaSelect label="Industry" value={industry} onValueChange={setIndustry} placeholder="Select industry">
                  {INDUSTRIES.map((option) => (
                    <LunaSelectItem key={option.value} value={option.value}>{option.label}</LunaSelectItem>
                  ))}
                </LunaSelect>
                <LunaSelect label="Organization Size" value={organizationSize} onValueChange={setOrganizationSize} placeholder="Select size">
                  {ORGANIZATION_SIZES.map((option) => (
                    <LunaSelectItem key={option.value} value={option.value}>{option.label}</LunaSelectItem>
                  ))}
                </LunaSelect>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LunaInput label="Founded Year" type="number" placeholder="2020" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} min="1800" max={new Date().getFullYear().toString()} />
                <LunaInput label="Employee Count" type="number" placeholder="50" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} min="1" />
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-luna-gray-900">Headquarters Address</h3>
                <LunaInput label="Street Address" placeholder="123 Main Street" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LunaInput label="City" placeholder="San Francisco" value={city} onChange={(e) => setCity(e.target.value)} />
                  <LunaInput label="State/Province" placeholder="California" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <LunaInput label="Country" placeholder="United States" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>

              <LunaInput label="Website URL" type="url" placeholder="https://yourcompany.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LunaInput label="Contact Email" type="email" placeholder="contact@yourcompany.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                <LunaInput label="Contact Phone" type="tel" placeholder="+1 (555) 123-4567" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              </div>

              <div className="border-t border-luna-border-default pt-4 mt-6">
                <h3 className="text-sm font-semibold text-luna-gray-900 mb-4">Social Media Links</h3>
                <div className="space-y-4">
                  <LunaInput label="LinkedIn URL" type="url" placeholder="https://linkedin.com/company/yourcompany" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <LunaInput label="Twitter URL" type="url" placeholder="https://twitter.com/yourcompany" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <LunaButton type="submit" variant="primary" loading={isSaving}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </LunaButton>
              </div>
            </form>
          </div>
        </LunaCard>
      </div>
    </div>
  );
}
