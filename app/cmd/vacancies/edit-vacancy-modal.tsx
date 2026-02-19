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
  LunaTextarea,
  LunaCombobox,
  LunaSwitch,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import type { VacancyData } from './page';

type EmploymentType = Database['public']['Enums']['employment_type'];

interface EditVacancyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  vacancy: VacancyData | null;
}

interface Skill {
  id: string;
  name: string;
}

export function EditVacancyModal({
  open,
  onOpenChange,
  onSuccess,
  vacancy,
}: EditVacancyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);

  // Form data
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [employmentType, setEmploymentType] = useState<EmploymentType[]>([]);
  const [responsibilities, setResponsibilities] = useState('');
  const [requirements, setRequirements] = useState('');
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  // Load vacancy data when modal opens
  useEffect(() => {
    if (open && vacancy) {
      setTitle(vacancy.title);
      setIsRemote(vacancy.is_remote);
      
      // Build location string
      const locationParts = [
        vacancy.location_city,
        vacancy.location_state,
        vacancy.location_country
      ].filter(Boolean);
      setLocation(locationParts.join(', '));
      
      setEmploymentType([vacancy.employment_type as EmploymentType]);
      setResponsibilities(vacancy.responsibilities || '');
      setRequirements(vacancy.requirements || '');
      setRequiredSkills(Array.isArray(vacancy.required_skills) ? vacancy.required_skills : []);
      setPreferredSkills(Array.isArray(vacancy.preferred_skills) ? vacancy.preferred_skills : []);
      setSalaryMin(vacancy.salary_range_min?.toString() || '');
      setSalaryMax(vacancy.salary_range_max?.toString() || '');

      fetchSkills();
    }
  }, [open, vacancy]);

  const fetchSkills = async () => {
    const supabase = createClient();
    const { data: skillsData } = await supabase
      .from('skills')
      .select('id, name')
      .order('name');

    if (skillsData) {
      setSkills(skillsData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacancy) return;

    if (!title.trim() || employmentType.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

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

      // Parse location
      const locationParts = location.split(',').map(s => s.trim());
      const locationCity = locationParts[0] || null;
      const locationState = locationParts[1] || null;
      const locationCountry = locationParts[2] || null;

      const response = await fetch('/api/admin/vacancies/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vacancy_id: vacancy.id,
          title: title.trim(),
          responsibilities: responsibilities.trim() || null,
          requirements: requirements.trim() || null,
          employment_type: employmentType[0],
          is_remote: isRemote,
          location_city: isRemote ? null : locationCity,
          location_state: isRemote ? null : locationState,
          location_country: isRemote ? null : locationCountry,
          salary_range_min: salaryMin ? parseInt(salaryMin) : null,
          salary_range_max: salaryMax ? parseInt(salaryMax) : null,
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update vacancy');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error updating vacancy:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onOpenChange(false);
  };

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

  if (!vacancy) return null;

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-luna-blue" />
            Edit Vacancy
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update vacancy information for {vacancy.organization.name}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-luna-gray-900">Basic Information</h3>

              <LunaInput
                label="Job Title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
              />

              <div className="flex items-center gap-2">
                <LunaSwitch checked={isRemote} onCheckedChange={setIsRemote} />
                <span className="text-sm text-luna-gray-700">Remote Position</span>
              </div>

              {!isRemote && (
                <LunaInput
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State, Country"
                  helperText="Enter location as: City, State, Country"
                />
              )}

              <LunaCombobox
                label="Employment Type"
                options={employmentTypeOptions}
                value={employmentType}
                onChange={(values) => setEmploymentType([values[0]] as EmploymentType[])}
                placeholder="Select employment type"
              />
            </div>

            {/* Job Details */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-luna-gray-900">Job Details</h3>

              <LunaTextarea
                label="Responsibilities"
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                placeholder="List key responsibilities..."
                rows={6}
              />

              <LunaTextarea
                label="Requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List requirements..."
                rows={6}
              />

              <LunaCombobox
                label="Required Skills"
                options={skillOptions}
                value={requiredSkills}
                onChange={setRequiredSkills}
                placeholder="Select required skills..."
                searchPlaceholder="Search skills..."
              />

              <LunaCombobox
                label="Preferred Skills"
                options={skillOptions}
                value={preferredSkills}
                onChange={setPreferredSkills}
                placeholder="Select preferred skills..."
                searchPlaceholder="Search skills..."
              />
            </div>

            {/* Compensation */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-luna-gray-900">Compensation</h3>

              <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          </form>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Updating...' : 'Update Vacancy'}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}
