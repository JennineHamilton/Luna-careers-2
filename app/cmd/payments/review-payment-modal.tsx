/**
 * Review Payment Modal
 * Modal for admins to approve or reject bank transfer submissions
 */

'use client';

import { useState } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaTextarea,
  LunaInputLabel,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';

interface ReviewPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: any;
  onSuccess?: () => void;
}

export function ReviewPaymentModal({
  open,
  onOpenChange,
  submission,
  onSuccess,
}: ReviewPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  const handleSubmit = async (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/payments/bank-transfer/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submission.id,
          action: selectedAction,
          admin_notes: adminNotes || null,
        }),
      });

      if (response.ok) {
        onSuccess?.();
        handleClose();
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${selectedAction} payment`);
      }
    } catch (err) {
      console.error('Error reviewing payment:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const handleClose = () => {
    setError('');
    setAdminNotes('');
    setAction(null);
    onOpenChange(false);
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>Review Bank Transfer Payment</LunaDialogTitle>
          <LunaDialogDescription>
            Review the payment details and approve or reject the submission
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* User Information */}
            <div className="bg-luna-gray-50 border border-luna-border-light rounded-lg p-4">
              <h3 className="text-sm font-semibold text-luna-gray-900 mb-3">User Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-luna-gray-600">Name:</span>
                  <p className="font-medium text-luna-gray-900">
                    {submission.user?.first_name || 'Unknown'} {submission.user?.last_name || 'User'}
                  </p>
                </div>
                <div>
                  <span className="text-luna-gray-600">Email:</span>
                  <p className="font-medium text-luna-gray-900">{submission.user?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">Payment Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">Content Type:</span>
                  <p className="font-medium text-blue-900 capitalize">{submission.enrollment_type}</p>
                </div>
                <div>
                  <span className="text-blue-700">Payment Method:</span>
                  <p className="font-medium text-blue-900 capitalize">
                    {submission.purchase?.payment_method === 'hybrid' ? 'Hybrid Payment' : 'Bank Transfer'}
                  </p>
                </div>
                <div>
                  <span className="text-blue-700">Amount Paid (Cash):</span>
                  <p className="font-medium text-blue-900">${submission.amount_paid.toFixed(2)} USD</p>
                </div>
                {submission.purchase && submission.purchase.amount_credits > 0 && (
                  <div>
                    <span className="text-blue-700">Credits Used:</span>
                    <p className="font-medium text-blue-900">{submission.purchase.amount_credits} credits</p>
                  </div>
                )}
                <div>
                  <span className="text-blue-700">Submitted:</span>
                  <p className="font-medium text-blue-900">{formatDateTime(submission.submitted_at)}</p>
                </div>
              </div>
            </div>

            {/* Bank Transfer Details */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Bank Transfer Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-green-700">User's Bank:</span>
                  <p className="font-medium text-green-900">{submission.user_bank_name}</p>
                </div>
                <div>
                  <span className="text-green-700">Account Holder:</span>
                  <p className="font-medium text-green-900">{submission.user_account_holder}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-green-700">Transaction Reference:</span>
                  <p className="font-medium text-green-900 font-mono">{submission.transaction_reference}</p>
                </div>
              </div>

              {submission.receipt_image_url && (
                <div className="mt-3 pt-3 border-t border-green-300">
                  <a href={submission.receipt_image_url} target="_blank" rel="noopener noreferrer">
                    <LunaButton size="sm" variant="secondary" className="flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      View Receipt
                    </LunaButton>
                  </a>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div>
              <LunaInputLabel htmlFor="adminNotes">Admin Notes (Optional)</LunaInputLabel>
              <LunaTextarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this review..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="button"
            variant="danger"
            onClick={() => handleSubmit('reject')}
            disabled={loading}
          >
            {loading && action === 'reject' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Payment
              </>
            )}
          </LunaButton>
          <LunaButton
            type="button"
            onClick={() => handleSubmit('approve')}
            disabled={loading}
          >
            {loading && action === 'approve' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve Payment
              </>
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}


