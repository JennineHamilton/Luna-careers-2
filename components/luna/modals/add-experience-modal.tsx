/**
 * Add/Edit Professional Experience Modal
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
  LunaCheckbox,
  LunaSearchableSelect,
} from '@/components/luna';
import { Loader2, Briefcase } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { Country, State } from 'country-state-city';

type ProfessionalExperience = Database['public']['Tables']['professional_experience']['Row'];

interface AddExperienceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  experience?: ProfessionalExperience | null;
}

export function AddExperienceModal({
  open,
  onOpenChange,
  onSuccess,
  experience,
}: AddExperienceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    job_title: '',
    company: '',
    description: '',
    location_country: '', // ISO code
    location_state: '', // ISO code
    start_date: '',
    end_date: '',
    currently_working: false,
  });

  // Country and state options
  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
  }, []);

  const stateOptions = useMemo(() => {
    if (!formData.location_country) return [];
    return State.getStatesOfCountry(formData.location_country).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }));
  }, [formData.location_country]);

  // Populate form when editing
  useEffect(() => {
    if (experience) {
      // Try to find country ISO code from stored country name
      const countryObj = experience.location_country
        ? Country.getAllCountries().find(c => c.name === experience.location_country || c.isoCode === experience.location_country)
        : null;
      const countryCode = countryObj?.isoCode || '';

      // Convert datetime strings to date format for date inputs (YYYY-MM-DD)
      const startDate = experience.start_date ? experience.start_date.split('T')[0] : '';
      const endDate = experience.end_date ? experience.end_date.split('T')[0] : '';

      setFormData({
        job_title: experience.job_title,
        company: experience.company,
        description: experience.description || '',
        location_country: countryCode,
        location_state: '', // State not stored in current schema
        start_date: startDate,
        end_date: endDate,
        currently_working: experience.currently_working || false,
      });
    } else {
      // Reset form when adding new
      setFormData({
        job_title: '',
        company: '',
        description: '',
        location_country: '',
        location_state: '',
        start_date: '',
        end_date: '',
        currently_working: false,
      });
    }
  }, [experience, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = experience
        ? `/api/user/professional-experience/${experience.id}`
        : '/api/user/professional-experience';
      const method = experience ? 'PATCH' : 'POST';

      // Convert country ISO code to country name for storage
      const countryName = formData.location_country
        ? Country.getCountryByCode(formData.location_country)?.name || formData.location_country
        : '';

      // Convert date strings to ISO datetime format (required by API validation)
      const startDateTime = formData.start_date ? new Date(formData.start_date).toISOString() : '';
      const endDateTime = formData.end_date && !formData.currently_working
        ? new Date(formData.end_date).toISOString()
        : null;

      // Prepare data for API
      const submitData = {
        job_title: formData.job_title,
        company: formData.company,
        description: formData.description || null,
        location_country: countryName || null,
        start_date: startDateTime,
        end_date: endDateTime,
        currently_working: formData.currently_working,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save experience');
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving experience:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent>
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              {experience ? 'Edit Professional Experience' : 'Add Professional Experience'}
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            {experience
              ? 'Update your work experience details'
              : 'Add your work experience to your profile'}
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

              <LunaInput
                label="Job Title"
                required
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="e.g. Software Engineer"
              />

              <LunaInput
                label="Company"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Tech Corp"
              />

              <LunaTextarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your responsibilities and achievements..."
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <LunaSearchableSelect
                  label="Country"
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                  options={countryOptions}
                  value={formData.location_country}
                  onValueChange={(value) => {
                    setFormData({ ...formData, location_country: value, location_state: '' });
                  }}
                />

                <LunaSearchableSelect
                  label="State/Province"
                  placeholder="Select state"
                  searchPlaceholder="Search states..."
                  options={stateOptions}
                  value={formData.location_state}
                  onValueChange={(value) => setFormData({ ...formData, location_state: value })}
                  disabled={!formData.location_country}
                  emptyMessage={formData.location_country ? 'No states found' : 'Select a country first'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <LunaInput
                  label="Start Date"
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />

                <LunaInput
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={formData.currently_working}
                />
              </div>

              <LunaCheckbox
                label="I currently work here"
                checked={formData.currently_working}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, currently_working: checked as boolean, end_date: '' })
                }
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
              {experience ? 'Update' : 'Add'} Experience
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

