'use client';

/**
 * Scholarship Application Form Component
 * Form for users to apply for scholarships within the enrollment modal
 */

import { useState } from 'react';
import {
  LunaButton,
  LunaInputLabel,
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
  LunaCheckbox,
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogFooter,
} from '@/components/luna';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { EMPLOYMENT_STATUS_OPTIONS } from '@/types/scholarship';
import type { ScholarshipApplicationFormData } from '@/types/scholarship';
import { validateApplicationData } from '@/lib/utils/scholarships';

interface ScholarshipApplicationFormProps {
  contentId: string;
  contentType: 'module' | 'course' | 'program';
  contentTitle: string;
  onSubmit: (data: ScholarshipApplicationFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ScholarshipApplicationForm({
  contentId,
  contentType,
  contentTitle,
  onSubmit,
  onCancel,
  loading = false,
}: ScholarshipApplicationFormProps) {
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [reasonForScholarship, setReasonForScholarship] = useState('');
  const [careerGoals, setCareerGoals] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Validate form data
    const validation = validateApplicationData({
      employment_status: employmentStatus,
      reason_for_scholarship: reasonForScholarship,
      career_goals: careerGoals,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (!agreedToTerms) {
      setErrors(['You must agree to the terms to submit your application']);
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmation(false);

    // Submit application
    try {
      await onSubmit({
        scholarship_id: '', // Will be determined by the API based on content
        content_type: contentType,
        content_id: contentId,
        employment_status: employmentStatus,
        reason_for_scholarship: reasonForScholarship,
        career_goals: careerGoals,
        additional_info: additionalInfo || undefined,
      });
    } catch (error) {
      console.error('Error submitting application:', error);
      setErrors(['Failed to submit application. Please try again.']);
    }
  };



  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-luna-gray-900">Apply for Scholarship</h3>
        <p className="text-sm text-luna-gray-600">
          Complete this application to request financial assistance for <strong>{contentTitle}</strong>.
          Our team will review your application within 5-7 business days.
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Please fix the following errors:</p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Employment Status */}
      <LunaSelect
        label="Current Employment Status"
        required
        value={employmentStatus}
        onValueChange={setEmploymentStatus}
        placeholder="Select your employment status"
      >
        {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
          <LunaSelectItem key={option.value} value={option.value}>
            {option.label}
          </LunaSelectItem>
        ))}
      </LunaSelect>

      {/* Reason for Scholarship */}
      <div className="space-y-2">
        <LunaInputLabel htmlFor="reason" required>
          Why do you need this scholarship?
        </LunaInputLabel>
        <LunaTextarea
          id="reason"
          value={reasonForScholarship}
          onChange={(e) => setReasonForScholarship(e.target.value)}
          placeholder="Please explain your financial situation and why you're requesting a scholarship..."
          rows={5}
          className="resize-none"
        />
      </div>

      {/* Career Goals */}
      <div className="space-y-2">
        <LunaInputLabel htmlFor="career-goals" required>
          How will this content help your career?
        </LunaInputLabel>
        <LunaTextarea
          id="career-goals"
          value={careerGoals}
          onChange={(e) => setCareerGoals(e.target.value)}
          placeholder="Describe your career goals and how this learning content will help you achieve them..."
          rows={5}
          className="resize-none"
        />
      </div>

      {/* Additional Information (Optional) */}
      <div className="space-y-2">
        <LunaInputLabel htmlFor="additional-info">
          Additional Information <span className="text-luna-gray-500">(Optional)</span>
        </LunaInputLabel>
        <LunaTextarea
          id="additional-info"
          value={additionalInfo}
          onChange={(e) => setAdditionalInfo(e.target.value)}
          placeholder="Any other information you'd like to share..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Terms Agreement */}
      <div className="flex items-start gap-3 p-4 bg-luna-gray-50 rounded-lg">
        <LunaCheckbox
          id="terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
        />
        <label htmlFor="terms" className="text-sm cursor-pointer text-luna-gray-700">
          I understand that scholarship approval is at the discretion of Luna Careers and is not guaranteed.
          I agree to provide accurate information in this application.
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-luna-border-light">
        <LunaButton type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </LunaButton>
        <LunaButton type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit Application
        </LunaButton>
      </div>
    </form>

    {/* Confirmation Dialog */}
    <LunaDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-luna-primary" />
            Confirm Scholarship Application
          </LunaDialogTitle>
          <LunaDialogDescription>
            Please review before submitting
          </LunaDialogDescription>
        </LunaDialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-luna-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-xs text-luna-gray-500 uppercase tracking-wide">
              {contentType}
            </p>
            <h3 className="font-semibold text-base">{contentTitle}</h3>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-luna-gray-700">
              You are about to submit a scholarship application for this {contentType}.
            </p>
            <p className="text-sm text-luna-gray-700">
              Your application will be reviewed by the Luna Careers team. You will be notified of the decision via email.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900">
              <strong>Note:</strong> You can only have one pending application per content at a time.
            </p>
          </div>
        </div>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="secondary"
            onClick={() => setShowConfirmation(false)}
            disabled={loading}
          >
            Go Back
          </LunaButton>
          <LunaButton
            type="button"
            onClick={handleConfirmSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm & Submit
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  </>
  );
}

