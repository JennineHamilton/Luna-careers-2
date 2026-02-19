/**
 * Add/Edit Education Modal
 */

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
  LunaSelect,
  LunaSelectItem,
  LunaCheckbox,
} from '@/components/luna';
import { Loader2, GraduationCap } from 'lucide-react';
import type { Database } from '@/types/database.types';

type Education = Database['public']['Tables']['education']['Row'];
type EducationLevel = Database['public']['Enums']['education_level'];

interface AddEducationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  education?: Education | null;
}

const EDUCATION_LEVELS: { value: EducationLevel; label: string }[] = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: 'Bachelor\'s Degree' },
  { value: 'master', label: 'Master\'s Degree' },
  { value: 'phd', label: 'PhD / Doctorate' },
];

export function AddEducationModal({
  open,
  onOpenChange,
  onSuccess,
  education,
}: AddEducationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    institution: '',
    education_level: 'bachelor' as EducationLevel,
    field_of_study: '',
    start_date: '',
    end_date: '',
    currently_enrolled: false,
    certificate_url: '',
  });

  useEffect(() => {
    if (education) {
      // Convert datetime strings to date format for date inputs (YYYY-MM-DD)
      const startDate = education.start_date ? education.start_date.split('T')[0] : '';
      const endDate = education.end_date ? education.end_date.split('T')[0] : '';

      setFormData({
        institution: education.institution,
        education_level: education.education_level,
        field_of_study: education.field_of_study,
        start_date: startDate,
        end_date: endDate,
        currently_enrolled: education.currently_enrolled || false,
        certificate_url: education.certificate_url || '',
      });
    } else {
      setFormData({
        institution: '',
        education_level: 'bachelor',
        field_of_study: '',
        start_date: '',
        end_date: '',
        currently_enrolled: false,
        certificate_url: '',
      });
    }
  }, [education, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = education
        ? `/api/user/education/${education.id}`
        : '/api/user/education';
      const method = education ? 'PATCH' : 'POST';

      // Convert date strings to ISO datetime format (required by API validation)
      const startDateTime = formData.start_date ? new Date(formData.start_date).toISOString() : '';
      const endDateTime = formData.end_date && !formData.currently_enrolled
        ? new Date(formData.end_date).toISOString()
        : null;

      // Prepare data for API
      const submitData = {
        institution: formData.institution,
        education_level: formData.education_level,
        field_of_study: formData.field_of_study,
        start_date: startDateTime,
        end_date: endDateTime,
        currently_enrolled: formData.currently_enrolled,
        certificate_url: formData.certificate_url || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save education');
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Error saving education:', err);
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
              <GraduationCap className="w-5 h-5" />
              {education ? 'Edit Education' : 'Add Education'}
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            {education ? 'Update your education details' : 'Add your educational background'}
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
                label="Institution"
                required
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                placeholder="e.g. University of California"
              />

              <LunaSelect
                label="Education Level"
                required
                value={formData.education_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, education_level: value as EducationLevel })
                }
              >
                {EDUCATION_LEVELS.map((level) => (
                  <LunaSelectItem key={level.value} value={level.value}>
                    {level.label}
                  </LunaSelectItem>
                ))}
              </LunaSelect>

              <LunaInput
                label="Field of Study"
                required
                value={formData.field_of_study}
                onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
                placeholder="e.g. Computer Science"
              />

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
                  disabled={formData.currently_enrolled}
                />
              </div>

              <LunaCheckbox
                label="I am currently enrolled"
                checked={formData.currently_enrolled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, currently_enrolled: checked as boolean, end_date: '' })
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
              {education ? 'Update' : 'Add'} Education
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

