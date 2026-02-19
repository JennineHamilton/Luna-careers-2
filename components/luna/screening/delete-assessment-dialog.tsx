'use client';

/**
 * Delete Assessment Dialog
 * Confirmation dialog for deleting assessments
 */

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
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface DeleteAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assessmentId: string;
  assessmentTitle: string;
}

export function DeleteAssessmentDialog({
  open,
  onClose,
  onSuccess,
  assessmentId,
  assessmentTitle,
}: DeleteAssessmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`/api/screening/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assessment');
      }

      setLoading(false);
      onClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error deleting assessment:', err);
      setError(err.message || 'Failed to delete assessment');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete Assessment
          </LunaDialogTitle>
          <LunaDialogDescription>
            This action cannot be undone
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-luna-gray-700">
            Are you sure you want to delete <strong>{assessmentTitle}</strong>?
          </p>
          <p className="text-sm text-luna-gray-600 mt-2">
            This will permanently delete:
          </p>
          <ul className="list-disc list-inside text-sm text-luna-gray-600 mt-2 space-y-1">
            <li>The assessment template</li>
            <li>All associated audio files</li>
            <li>All user attempts and results</li>
            <li>All user badges earned from this assessment</li>
          </ul>
        </LunaDialogBody>

        <LunaDialogFooter className="flex items-center justify-end gap-2">
          <LunaButton
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton
            type="button"
            variant="danger"
            onClick={handleDelete}
            loading={loading}
          >
            Delete Assessment
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

