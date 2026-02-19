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
  LunaTextarea,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Ban, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { VacancyData } from './page';

interface SuspendVacancyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  vacancy: VacancyData | null;
}

export function SuspendVacancyModal({
  open,
  onOpenChange,
  onSuccess,
  vacancy,
}: SuspendVacancyModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');

  const isActive = vacancy?.is_active !== false;
  const action = isActive ? 'suspend' : 'unsuspend';

  useEffect(() => {
    if (!open) {
      setReason('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacancy) return;

    if (isActive && !reason.trim()) {
      setError('Please provide a reason for suspension');
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

      const response = await fetch('/api/admin/vacancies/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vacancy_id: vacancy.id,
          suspend: isActive,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to ${action} vacancy`);
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error(`Error ${action}ing vacancy:`, err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onOpenChange(false);
  };

  if (!vacancy) return null;

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            {isActive ? (
              <>
                <Ban className="h-5 w-5 text-luna-error" />
                Suspend Vacancy
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-luna-success" />
                Unsuspend Vacancy
              </>
            )}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {isActive
              ? `Suspend "${vacancy.title}" and lock it from the employer portal`
              : `Restore "${vacancy.title}" and unlock it for the employer`}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isActive ? (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-900">
                    <strong>Warning:</strong> When you suspend this vacancy:
                  </p>
                  <ul className="list-disc list-inside text-sm text-amber-800 mt-2 space-y-1">
                    <li>It will be locked from the employer's portal</li>
                    <li>The employer will see a notice with your reason</li>
                    <li>Only platform admins can unsuspend it</li>
                    <li>The employer must contact support to resolve the issue</li>
                  </ul>
                </div>

                <LunaTextarea
                  label="Reason for Suspension"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter a short reason that will be shown to the employer..."
                  rows={4}
                  helperText="This reason will be displayed to the employer"
                />
              </>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  <strong>Unsuspend Vacancy:</strong> This will restore access to the vacancy in the employer's portal and allow them to manage it again.
                </p>
              </div>
            )}
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
          <LunaButton
            variant={isActive ? 'danger' : 'primary'}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? `${isActive ? 'Suspending' : 'Unsuspending'}...` : `${isActive ? 'Suspend' : 'Unsuspend'} Vacancy`}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

