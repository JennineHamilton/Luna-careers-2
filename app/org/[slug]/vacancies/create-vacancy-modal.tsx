'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaButton } from '@/components/luna/button';
import { LunaInput, LunaInputLabel } from '@/components/luna/input';
import { LunaTextarea } from '@/components/luna/textarea';
import { LunaCombobox } from '@/components/luna/combobox';
import { LunaSwitch } from '@/components/luna/switch';
import { createClient } from '@/lib/supabase/client';
import { Country, State, City } from 'country-state-city';
import type { Database } from '@/types/database.types';

type EmploymentType = Database['public']['Enums']['employment_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

interface CreateVacancyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function CreateVacancyModal({ open, onOpenChange, organizationId }: CreateVacancyModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType[]>([]);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel[]>([]);
  const [isRemote, setIsRemote] = useState(false);
  const [country, setCountry] = useState<string[]>([]);
  const [state, setState] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [benefits, setBenefits] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');

  const countries = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
  const states = country[0] ? State.getStatesOfCountry(country[0]).map(s => ({ label: s.name, value: s.isoCode })) : [];
  const cities = country[0] && state[0] ? City.getCitiesOfState(country[0], state[0]).map(c => ({ label: c.name, value: c.name })) : [];

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || employmentType.length === 0 || experienceLevel.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      // Parse skills and benefits
      const requiredSkillsArray = requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const preferredSkillsArray = preferredSkills.split(',').map(s => s.trim()).filter(Boolean);
      const benefitsArray = benefits.split(',').map(s => s.trim()).filter(Boolean);

      const { error: insertError } = await supabase
        .from('vacancies')
        .insert({
          organization_id: organizationId,
          title: title.trim(),
          description: description.trim(),
          requirements: requirements.trim() || null,
          responsibilities: responsibilities.trim() || null,
          employment_type: employmentType[0],
          experience_level: experienceLevel[0],
          is_remote: isRemote,
          location_country: country[0] || null,
          location_state: state[0] || null,
          location_city: city[0] || null,
          salary_range_min: salaryMin ? parseInt(salaryMin) : null,
          salary_range_max: salaryMax ? parseInt(salaryMax) : null,
          salary_currency: salaryCurrency,
          required_skills: requiredSkillsArray,
          preferred_skills: preferredSkillsArray,
          benefits: benefitsArray,
          application_deadline: applicationDeadline || null,
          is_active: true,
          created_by: user.id,
        });

      if (insertError) {
        throw insertError;
      }

      // Reset form
      setTitle('');
      setDescription('');
      setRequirements('');
      setResponsibilities('');
      setEmploymentType([]);
      setExperienceLevel([]);
      setIsRemote(false);
      setCountry([]);
      setState([]);
      setCity([]);
      setSalaryMin('');
      setSalaryMax('');
      setRequiredSkills('');
      setPreferredSkills('');
      setBenefits('');
      setApplicationDeadline('');

      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create vacancy');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <LunaDialogHeader>
          <LunaDialogTitle>Create New Vacancy</LunaDialogTitle>
        </LunaDialogHeader>
        <LunaDialogBody className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            <div>
              <LunaInputLabel htmlFor="title" required>Job Title</LunaInputLabel>
              <LunaInput
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div>
              <LunaInputLabel htmlFor="description" required>Job Description</LunaInputLabel>
              <LunaTextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <LunaInputLabel required>Employment Type</LunaInputLabel>
                <LunaCombobox
                  options={[
                    { label: 'Full Time', value: 'full-time' },
                    { label: 'Part Time', value: 'part-time' },
                    { label: 'Contract', value: 'contract' },
                    { label: 'Internship', value: 'internship' },
                    { label: 'Temporary', value: 'temporary' },
                  ]}
                  value={employmentType}
                  onChange={(values) => setEmploymentType([values[0]] as EmploymentType[])}
                  placeholder="Select type"
                />
              </div>
              <div>
                <LunaInputLabel required>Experience Level</LunaInputLabel>
                <LunaCombobox
                  options={[
                    { label: 'Entry', value: 'entry' },
                    { label: 'Mid', value: 'mid' },
                    { label: 'Senior', value: 'senior' },
                    { label: 'Lead', value: 'lead' },
                    { label: 'Executive', value: 'executive' },
                  ]}
                  value={experienceLevel}
                  onChange={(values) => setExperienceLevel([values[0]] as ExperienceLevel[])}
                  placeholder="Select level"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            <div className="flex items-center gap-2">
              <LunaSwitch checked={isRemote} onCheckedChange={setIsRemote} />
              <span className="text-sm text-gray-700">Remote Position</span>
            </div>
            {!isRemote && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <LunaInputLabel>Country</LunaInputLabel>
                  <LunaCombobox
                    options={countries}
                    value={country}
                    onChange={(values) => {
                      setCountry(values);
                      setState([]);
                      setCity([]);
                    }}
                    placeholder="Select country"
                  />
                </div>
                <div>
                  <LunaInputLabel>State</LunaInputLabel>
                  <LunaCombobox
                    options={states}
                    value={state}
                    onChange={(values) => {
                      setState(values);
                      setCity([]);
                    }}
                    placeholder="Select state"
                    disabled={!country[0]}
                  />
                </div>
                <div>
                  <LunaInputLabel>City</LunaInputLabel>
                  <LunaCombobox
                    options={cities}
                    value={city}
                    onChange={setCity}
                    placeholder="Select city"
                    disabled={!state[0]}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
            <div>
              <LunaInputLabel htmlFor="responsibilities">Responsibilities</LunaInputLabel>
              <LunaTextarea
                id="responsibilities"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="List key responsibilities..."
                rows={4}
              />
            </div>
            <div>
              <LunaInputLabel htmlFor="requirements">Requirements</LunaInputLabel>
              <LunaTextarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List requirements..."
                rows={4}
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Compensation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <LunaInputLabel htmlFor="salaryMin">Minimum Salary</LunaInputLabel>
                <LunaInput
                  id="salaryMin"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div>
                <LunaInputLabel htmlFor="salaryMax">Maximum Salary</LunaInputLabel>
                <LunaInput
                  id="salaryMax"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="80000"
                />
              </div>
              <div>
                <LunaInputLabel htmlFor="currency">Currency</LunaInputLabel>
                <LunaInput
                  id="currency"
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  placeholder="USD"
                />
              </div>
            </div>
          </div>

          {/* Skills & Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills & Benefits</h3>
            <div>
              <LunaInputLabel htmlFor="requiredSkills">Required Skills (comma-separated)</LunaInputLabel>
              <LunaInput
                id="requiredSkills"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="React, TypeScript, Node.js"
              />
            </div>
            <div>
              <LunaInputLabel htmlFor="preferredSkills">Preferred Skills (comma-separated)</LunaInputLabel>
              <LunaInput
                id="preferredSkills"
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="GraphQL, AWS, Docker"
              />
            </div>
            <div>
              <LunaInputLabel htmlFor="benefits">Benefits (comma-separated)</LunaInputLabel>
              <LunaInput
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="Health Insurance, 401k, Remote Work"
              />
            </div>
          </div>

          {/* Application Deadline */}
          <div>
            <LunaInputLabel htmlFor="deadline">Application Deadline</LunaInputLabel>
            <LunaInput
              id="deadline"
              type="datetime-local"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
            />
          </div>
        </LunaDialogBody>
        <LunaDialogFooter>
          <LunaButton variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </LunaButton>
          <LunaButton onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Vacancy'}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

