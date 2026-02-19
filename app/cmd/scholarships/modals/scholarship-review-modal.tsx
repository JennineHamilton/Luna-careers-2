'use client';

import { useState } from 'react';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogDescription, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaButton } from '@/components/luna/button';
import { LunaInputLabel } from '@/components/luna/input';
import { LunaTextarea } from '@/components/luna/textarea';
import { LunaBadge } from '@/components/luna/badge';
import { FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { SCHOLARSHIP_STATUS_CONFIG, type ScholarshipApplicationData } from '@/types/scholarship';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

type ScholarshipApplicationRow = Database['public']['Tables']['scholarship_applications']['Row'];

interface ScholarshipApplication extends ScholarshipApplicationRow {
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  scholarships: {
    id: string;
    name: string;
    type: string;
    discount_percentage: number;
  } | null;
}

interface ScholarshipReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: ScholarshipApplication;
  contentDetails: Record<string, { title: string; image: string | null; type: string }>;
  currentUserId: string;
  onSuccess: (application: ScholarshipApplication) => void;
}

export function ScholarshipReviewModal({
  open,
  onOpenChange,
  application,
  contentDetails,
  currentUserId,
  onSuccess,
}: ScholarshipReviewModalProps) {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(90);

  const content = contentDetails[application.content_id];
  const user = application.users;
  const scholarship = application.scholarships;

  // Type guard for application_data (Json type from database)
  const isValidAppData = (data: unknown): data is ScholarshipApplicationData => {
    return (
      typeof data === 'object' &&
      data !== null &&
      !Array.isArray(data) &&
      'employment_status' in data &&
      'reason_for_scholarship' in data &&
      'career_goals' in data
    );
  };

  const appData: ScholarshipApplicationData = isValidAppData(application.application_data)
    ? application.application_data
    : {
        employment_status: '',
        reason_for_scholarship: '',
        career_goals: '',
        additional_info: ''
      };

  const statusConfig = SCHOLARSHIP_STATUS_CONFIG[application.status as keyof typeof SCHOLARSHIP_STATUS_CONFIG];

  const handleSubmit = async () => {
    if (!decision) {
      alert('Please select a decision (Approve or Reject)');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in');
        return;
      }

      const expiresAt = decision === 'approved' 
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const response = await fetch(`/api/learning/scholarships/applications/${application.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status: decision,
          review_notes: reviewNotes,
          expires_at: expiresAt,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to review application');
      }

      const { application: updatedApplication } = await response.json();
      onSuccess(updatedApplication);
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert(error instanceof Error ? error.message : 'Failed to review application');
    } finally {
      setLoading(false);
    }
  };

  const canReview = application.status === 'pending';

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Scholarship Application Review
          </LunaDialogTitle>
          <LunaDialogDescription>
            Review and make a decision on this scholarship application
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 bg-luna-gray-50 rounded-lg">
              <div>
                <LunaInputLabel className="mb-1">Current Status</LunaInputLabel>
                <LunaBadge variant={statusConfig.variant}>{statusConfig.label}</LunaBadge>
              </div>
              {application.reviewed_at && (
                <div className="text-right">
                  <LunaInputLabel className="mb-1">Reviewed</LunaInputLabel>
                  <p className="text-sm text-luna-gray-600">{formatDateTime(application.reviewed_at, true)}</p>
                </div>
              )}
            </div>

            {/* Applicant Information */}
            <div>
              <LunaInputLabel className="mb-3">Applicant Information</LunaInputLabel>
              <div className="grid grid-cols-2 gap-4 p-4 bg-luna-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-luna-gray-600 mb-1">Name</p>
                  <p className="font-medium">{user?.first_name || ''} {user?.last_name || ''}</p>
                </div>
                <div>
                  <p className="text-xs text-luna-gray-600 mb-1">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Learning Content */}
            <div>
              <LunaInputLabel className="mb-3">Learning Content</LunaInputLabel>
              <div className="flex items-center gap-4 p-4 bg-luna-gray-50 rounded-lg">
                {content?.image ? (
                  <Image
                    src={content.image}
                    alt={content.title}
                    width={60}
                    height={60}
                    className="rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="w-15 h-15 rounded bg-luna-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-lg text-luna-gray-600 font-medium">
                      {content?.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-luna-gray-900">{content?.title}</p>
                  <p className="text-xs text-luna-gray-500 capitalize mt-1">{content?.type}</p>
                </div>
              </div>
            </div>

            {/* Scholarship Details */}
            <div>
              <LunaInputLabel className="mb-3">Scholarship</LunaInputLabel>
              <div className="grid grid-cols-2 gap-4 p-4 bg-luna-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-luna-gray-600 mb-1">Scholarship Name</p>
                  <p className="font-medium">{scholarship?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-luna-gray-600 mb-1">Discount</p>
                  <p className="font-medium">
                    {scholarship?.type === 'full' ? 'Full' : 'Partial'} ({scholarship?.discount_percentage}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Application Responses */}
            {appData && (
              <div>
                <LunaInputLabel className="mb-3">Application Responses</LunaInputLabel>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-luna-gray-600 mb-1">Employment Status</p>
                    <p className="text-sm">{appData.employment_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-600 mb-1">Why do you need this scholarship?</p>
                    <p className="text-sm">{appData.reason_for_scholarship}</p>
                  </div>
                  <div>
                    <p className="text-xs text-luna-gray-600 mb-1">How will this help your career?</p>
                    <p className="text-sm">{appData.career_goals}</p>
                  </div>
                  {appData.additional_info && (
                    <div>
                      <p className="text-xs text-luna-gray-600 mb-1">Additional Information</p>
                      <p className="text-sm">{appData.additional_info}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Section (only for pending applications) */}
            {canReview && (
              <>
                <div className="border-t border-luna-border-default pt-6">
                  <LunaInputLabel className="mb-3">Admin Decision</LunaInputLabel>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDecision('approved')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        decision === 'approved'
                          ? 'border-green-500 bg-green-50'
                          : 'border-luna-border-default hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className={`w-5 h-5 ${decision === 'approved' ? 'text-green-600' : 'text-luna-gray-400'}`} />
                        <span className={`font-medium ${decision === 'approved' ? 'text-green-700' : 'text-luna-gray-700'}`}>
                          Approve
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecision('rejected')}
                      className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                        decision === 'rejected'
                          ? 'border-red-500 bg-red-50'
                          : 'border-luna-border-default hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <XCircle className={`w-5 h-5 ${decision === 'rejected' ? 'text-red-600' : 'text-luna-gray-400'}`} />
                        <span className={`font-medium ${decision === 'rejected' ? 'text-red-700' : 'text-luna-gray-700'}`}>
                          Reject
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {decision === 'approved' && (
                  <div>
                    <LunaInputLabel htmlFor="expires_in_days">Scholarship Expiration (days from approval)</LunaInputLabel>
                    <input
                      id="expires_in_days"
                      type="number"
                      min="1"
                      value={expiresInDays}
                      onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 90)}
                      className="w-full px-3 py-2 border border-luna-border-default rounded-md"
                    />
                    <p className="text-xs text-luna-gray-600 mt-1">
                      Scholarship will expire on {new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div>
                  <LunaInputLabel htmlFor="review_notes">Admin Notes (internal)</LunaInputLabel>
                  <LunaTextarea
                    id="review_notes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add internal notes about this decision..."
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* Existing Review Notes (for already reviewed applications) */}
            {!canReview && application.review_notes && (
              <div>
                <LunaInputLabel className="mb-2">Review Notes</LunaInputLabel>
                <p className="text-sm text-luna-gray-700 p-4 bg-luna-gray-50 rounded-lg">
                  {application.review_notes}
                </p>
              </div>
            )}
          </div>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {canReview ? 'Cancel' : 'Close'}
          </LunaButton>
          {canReview && (
            <LunaButton onClick={handleSubmit} disabled={loading || !decision}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Decision
            </LunaButton>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

