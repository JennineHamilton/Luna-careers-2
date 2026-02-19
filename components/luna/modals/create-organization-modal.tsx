/**
 * Create Organization Modal
 * 2-step modal: Create organization → Create admin user
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
  LunaBadge,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building2, User, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Country, State } from 'country-state-city';

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'organization' | 'admin';

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const [step, setStep] = useState<Step>('organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Organization data
  const [orgData, setOrgData] = useState({
    name: '',
    slug: '',
    industry: '',
    contact_email: '',
    contact_phone: '',
    contact_phone_country_code: '+1',
    street_address: '',
    city: '',
    state: '',
    country: 'US', // ISO code for country-state-city library
  });

  // Track if slug has been manually edited
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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

  // Auto-generate slug from organization name
  useEffect(() => {
    if (!slugManuallyEdited) {
      const generatedSlug = orgData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setOrgData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [orgData.name, slugManuallyEdited]);
  
  const [createdOrgId, setCreatedOrgId] = useState('');
  const [createdOrgName, setCreatedOrgName] = useState('');
  
  // Admin user data
  const [adminData, setAdminData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { Country, State } = await import('country-state-city');
      const countryName = orgData.country
        ? Country.getCountryByCode(orgData.country)?.name || orgData.country
        : '';
      const stateName = orgData.state && orgData.country
        ? State.getStateByCodeAndCountry(orgData.state, orgData.country)?.name || orgData.state
        : '';

      const response = await fetch('/api/admin/organizations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: orgData.name,
          industry: orgData.industry,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          street_address: orgData.street_address,
          city: orgData.city,
          state: stateName,
          country: countryName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create organization');
        setLoading(false);
        return;
      }
      
      // Store organization ID and move to next step
      setCreatedOrgId(data.organization.id);
      setCreatedOrgName(data.organization.name);
      setStep('admin');
      setLoading(false);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...adminData,
          account_type: 'hybrid', // Organization users are hybrid
          user_role: 'org_admin',
          organization_id: createdOrgId,
          organization_name: createdOrgName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create admin user');
        setLoading(false);
        return;
      }
      
      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating admin:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setStep('organization');
    setOrgData({
      name: '',
      slug: '',
      industry: '',
      contact_email: '',
      contact_phone: '',
      contact_phone_country_code: '+1',
      street_address: '',
      city: '',
      state: '',
      country: 'US',
    });
    setAdminData({
      email: '',
      first_name: '',
      last_name: '',
    });
    setCreatedOrgId('');
    setCreatedOrgName('');
    setError('');
    setSlugManuallyEdited(false);
    onOpenChange(false);
  };
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        {/* Header with title and step indicator */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            {step === 'organization' ? (
              <>
                <Building2 className="h-5 w-5 text-luna-blue" />
                Create Organization
              </>
            ) : (
              <>
                <User className="h-5 w-5 text-luna-blue" />
                Create Organization Admin
              </>
            )}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {step === 'organization'
              ? 'Step 1 of 2: Enter organization details'
              : `Step 2 of 2: Create admin user for ${createdOrgName}`}
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Body with form content */}
        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'organization' ? (
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              {/* Organization Name */}
              <LunaInput
                label="Organization Name"
                required
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                placeholder="Acme Corporation"
              />

              {/* URL Slug + Industry */}
              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="URL Slug"
                  required
                  value={orgData.slug}
                  onChange={(e) => {
                    setOrgData({ ...orgData, slug: e.target.value });
                    setSlugManuallyEdited(true);
                  }}
                  placeholder="acme-corporation"
                />

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
              </div>

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
          ) : (
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900">Organization Created</p>
                  <p className="text-sm text-green-700">
                    {createdOrgName} has been created. Now create the admin user.
                  </p>
                </div>
              </div>

              {/* Admin User Details */}
              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="First Name"
                  required
                  value={adminData.first_name}
                  onChange={(e) => setAdminData({ ...adminData, first_name: e.target.value })}
                  placeholder="John"
                />

                <LunaInput
                  label="Last Name"
                  required
                  value={adminData.last_name}
                  onChange={(e) => setAdminData({ ...adminData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <LunaInput
                label="Email Address"
                type="email"
                required
                value={adminData.email}
                onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </form>
          )}
        </LunaDialogBody>

        {/* Footer with action buttons */}
        <LunaDialogFooter>
          {step === 'organization' ? (
            <>
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
                disabled={loading || !orgData.name || !orgData.slug || !orgData.industry}
                onClick={handleCreateOrganization}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  'Next: Create Admin'
                )}
              </LunaButton>
            </>
          ) : (
            <>
              <LunaButton
                type="button"
                variant="secondary"
                onClick={() => setStep('organization')}
                disabled={loading}
              >
                Back
              </LunaButton>
              <LunaButton
                type="submit"
                disabled={loading || !adminData.email || !adminData.first_name || !adminData.last_name}
                onClick={handleCreateAdmin}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating & Sending Invitation...
                  </>
                ) : (
                  'Create Admin & Send Invitation'
                )}
              </LunaButton>
            </>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

