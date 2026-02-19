'use client';

import { useState, useEffect } from 'react';
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
  LunaCombobox,
  LunaRichTextEditor,
  LunaDatePicker,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Briefcase, FileText, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { Country, State, City } from 'country-state-city';

type EmploymentType = Database['public']['Enums']['employment_type'];
type ExperienceLevel = Database['public']['Enums']['experience_level'];

interface CreateVacancyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 'basic' | 'details' | 'compensation';

interface Organization {
  id: string;
  name: string;
}

interface Skill {
  id: string;
  name: string;
}

export function CreateVacancyModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateVacancyModalProps) {
  const [step, setStep] = useState<Step>('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data for dropdowns
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  // Form data - Step 1: Basic Information
  const [title, setTitle] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [description, setDescription] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid');
  const [workLocation, setWorkLocation] = useState<'remote' | 'in-office' | 'hybrid'>('in-office');
  const [country, setCountry] = useState<string[]>([]);
  const [state, setState] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full-time');

  // Form data - Step 2: Job Details
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');

  // Form data - Step 3: Compensation & Skills
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState<'hourly' | 'monthly' | 'yearly'>('yearly');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);

  // Fetch organizations and skills on mount
  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch organizations
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (orgsData) {
      setOrganizations(orgsData);
    }

    // Fetch skills
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name')
      .order('name');

    if (skillsData) {
      setSkills(skillsData);
    }
  };

  const handleNext = () => {
    if (step === 'basic') {
      if (!title.trim() || !organizationId || !description.trim() || !employmentType) {
        setError('Please fill in all required fields');
        return;
      }
      setError('');
      setStep('details');
    } else if (step === 'details') {
      setError('');
      setStep('compensation');
    }
  };

  // Get location options
  const countries = Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode }));
  const states = country[0] ? State.getStatesOfCountry(country[0]).map(s => ({ label: s.name, value: s.isoCode })) : [];
  const cities = country[0] && state[0] ? City.getCitiesOfState(country[0], state[0]).map(c => ({ label: c.name, value: c.name })) : [];

  const handlePrevious = () => {
    setError('');
    if (step === 'details') {
      setStep('basic');
    } else if (step === 'compensation') {
      setStep('details');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Get location names from ISO codes
      const countryName = country[0] ? Country.getCountryByCode(country[0])?.name || null : null;
      const stateName = country[0] && state[0] ? State.getStateByCodeAndCountry(state[0], country[0])?.name || null : null;
      const cityName = city[0] || null;

      const response = await fetch('/api/admin/vacancies/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organization_id: organizationId,
          title: title.trim(),
          description: description.trim(),
          responsibilities: responsibilities.trim() || null,
          requirements: requirements.trim() || null,
          employment_type: employmentType,
          experience_level: experienceLevel,
          is_remote: workLocation === 'remote',
          location_city: workLocation === 'remote' ? null : cityName,
          location_state: workLocation === 'remote' ? null : stateName,
          location_country: workLocation === 'remote' ? null : countryName,
          salary_range_min: salaryMin ? parseInt(salaryMin) : null,
          salary_range_max: salaryMax ? parseInt(salaryMax) : null,
          salary_currency: 'USD',
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
          application_deadline: deadline ? deadline.toISOString() : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create vacancy');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating vacancy:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('basic');
    setTitle('');
    setOrganizationId('');
    setDescription('');
    setExperienceLevel('mid');
    setWorkLocation('in-office');
    setCountry([]);
    setState([]);
    setCity([]);
    setEmploymentType('full-time');
    setResponsibilities('');
    setRequirements('');
    setRequiredSkills([]);
    setPreferredSkills([]);
    setSalaryMin('');
    setSalaryMax('');
    setSalaryPeriod('yearly');
    setDeadline(undefined);
    setError('');
    onOpenChange(false);
  };

  const organizationOptions = organizations.map(org => ({
    value: org.id,
    label: org.name,
  }));

  const skillOptions = skills.map(skill => ({
    value: skill.id,
    label: skill.name,
  }));

  const employmentTypeOptions = [
    { label: 'Full Time', value: 'full-time' },
    { label: 'Part Time', value: 'part-time' },
    { label: 'Contract', value: 'contract' },
    { label: 'Internship', value: 'internship' },
    { label: 'Temporary', value: 'temporary' },
  ];

  const experienceLevelOptions = [
    { label: 'Entry Level', value: 'entry' },
    { label: 'Mid Level', value: 'mid' },
    { label: 'Senior Level', value: 'senior' },
    { label: 'Lead', value: 'lead' },
    { label: 'Executive', value: 'executive' },
  ];

  const salaryPeriodOptions = [
    { label: 'Hourly', value: 'hourly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const workLocationOptions = [
    { label: 'Remote', value: 'remote' },
    { label: 'In Office', value: 'in-office' },
    { label: 'Hybrid', value: 'hybrid' },
  ];

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            {step === 'basic' && (
              <>
                <Briefcase className="h-5 w-5 text-luna-blue" />
                Create Vacancy - Basic Information
              </>
            )}
            {step === 'details' && (
              <>
                <FileText className="h-5 w-5 text-luna-blue" />
                Create Vacancy - Responsibilities & Requirements
              </>
            )}
            {step === 'compensation' && (
              <>
                <DollarSign className="h-5 w-5 text-luna-blue" />
                Create Vacancy - Skills & Compensation
              </>
            )}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {step === 'basic' && 'Step 1 of 3: Enter job title, employer, description, and location'}
            {step === 'details' && 'Step 2 of 3: Define responsibilities and requirements'}
            {step === 'compensation' && 'Step 3 of 3: Add skills, salary range, and deadline'}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'basic' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <LunaInput
                label="Job Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />

              <div className="grid grid-cols-3 gap-4">
                <LunaSearchableSelect
                  label="Employer"
                  required
                  placeholder="Select employer"
                  searchPlaceholder="Search employers..."
                  options={organizationOptions}
                  value={organizationId}
                  onValueChange={setOrganizationId}
                />

                <LunaSearchableSelect
                  label="Experience Level"
                  required
                  placeholder="Select level"
                  options={experienceLevelOptions}
                  value={experienceLevel}
                  onValueChange={(value) => setExperienceLevel(value as ExperienceLevel)}
                />

                <LunaSearchableSelect
                  label="Employment Type"
                  required
                  placeholder="Select type"
                  options={employmentTypeOptions}
                  value={employmentType}
                  onValueChange={(value) => setEmploymentType(value as EmploymentType)}
                />
              </div>

              <LunaRichTextEditor
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Enter job description..."
                minHeight={75}
              />

              <LunaSearchableSelect
                label="Work Location"
                required
                placeholder="Select work location"
                options={workLocationOptions}
                value={workLocation}
                onValueChange={(value) => setWorkLocation(value as 'remote' | 'in-office' | 'hybrid')}
              />

              {workLocation !== 'remote' && (
                <div className="grid grid-cols-3 gap-4">
                  <LunaSearchableSelect
                    label="Country"
                    placeholder="Select country"
                    searchPlaceholder="Search countries..."
                    options={countries}
                    value={country[0] || ''}
                    onValueChange={(value) => {
                      setCountry(value ? [value] : []);
                      setState([]);
                      setCity([]);
                    }}
                  />

                  <LunaSearchableSelect
                    label="State"
                    placeholder="Select state"
                    searchPlaceholder="Search states..."
                    options={states}
                    value={state[0] || ''}
                    onValueChange={(value) => {
                      setState(value ? [value] : []);
                      setCity([]);
                    }}
                    disabled={!country[0]}
                  />

                  <LunaSearchableSelect
                    label="City"
                    placeholder="Select city"
                    searchPlaceholder="Search cities..."
                    options={cities}
                    value={city[0] || ''}
                    onValueChange={(value) => setCity(value ? [value] : [])}
                    disabled={!state[0]}
                  />
                </div>
              )}
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
              <LunaRichTextEditor
                label="Responsibilities"
                value={responsibilities}
                onChange={setResponsibilities}
                placeholder="List key responsibilities..."
                minHeight={75}
                helperText="Describe the main duties and responsibilities of this role"
              />

              <LunaRichTextEditor
                label="Requirements"
                value={requirements}
                onChange={setRequirements}
                placeholder="List requirements..."
                minHeight={75}
                helperText="Describe the qualifications and requirements for this role"
              />
            </form>
          )}

          {step === 'compensation' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <LunaCombobox
                label="Required Skills"
                options={skillOptions}
                value={requiredSkills}
                onChange={setRequiredSkills}
                placeholder="Select required skills..."
                searchPlaceholder="Search skills..."
                helperText="Select skills that are required for this position"
              />

              <LunaCombobox
                label="Preferred Skills"
                options={skillOptions}
                value={preferredSkills}
                onChange={setPreferredSkills}
                placeholder="Select preferred skills..."
                searchPlaceholder="Search skills..."
                helperText="Select skills that are nice to have but not required"
              />

              <div className="grid grid-cols-3 gap-4">
                <LunaInput
                  label="Minimum Salary"
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="50000"
                  helperText="Optional"
                />

                <LunaInput
                  label="Maximum Salary"
                  type="number"
                  value={salaryMax}
                  onChange={(e) => setSalaryMax(e.target.value)}
                  placeholder="80000"
                  helperText="Optional"
                />

                <LunaSearchableSelect
                  label="Salary Period"
                  placeholder="Select period"
                  options={salaryPeriodOptions}
                  value={salaryPeriod}
                  onValueChange={(value) => setSalaryPeriod(value as 'hourly' | 'monthly' | 'yearly')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-luna-gray-900 mb-1.5">
                  Application Deadline
                </label>
                <LunaDatePicker
                  value={deadline}
                  onChange={setDeadline}
                  placeholder="Select application deadline"
                />
              </div>

              <div className="bg-luna-blue/5 border border-luna-blue/20 rounded-lg p-3">
                <p className="text-sm text-luna-gray-700">
                  <strong>Note:</strong> Compensation is displayed in dollars by default. Users can view converted amounts on the vacancy details page.
                </p>
              </div>
            </form>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          {step !== 'basic' && (
            <LunaButton
              variant="outline"
              onClick={handlePrevious}
              disabled={loading}
            >
              Previous
            </LunaButton>
          )}

          <LunaButton
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>

          {step !== 'compensation' ? (
            <LunaButton onClick={handleNext} disabled={loading}>
              Next
            </LunaButton>
          ) : (
            <LunaButton onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Vacancy'}
            </LunaButton>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

