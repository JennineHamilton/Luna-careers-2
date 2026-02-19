/**
 * Suspend Organization Modal
 * For suspending/unsuspending organizations (platform admin only)
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
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SuspendOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  organization: {
    id: string;
    name: string;
    is_active?: boolean;
  } | null;
}

export function SuspendOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
  organization,
}: SuspendOrganizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  
  const isActive = organization?.is_active !== false;
  const action = isActive ? 'suspend' : 'unsuspend';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
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
      
      const response = await fetch('/api/admin/organizations/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          organization_id: organization.id,
          suspend: isActive,
          reason: reason.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || `Failed to ${action} organization`);
        setLoading(false);
        return;
      }
      
      // Success
      onSuccess?.();
      onOpenChange(false);
      setReason('');
    } catch (err) {
      console.error(`Error ${action}ing organization:`, err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!loading) {
      setError('');
      setReason('');
      onOpenChange(false);
    }
  };
  
  if (!organization) return null;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            {isActive ? (
              <>
                <Ban className="h-5 w-5 text-luna-error" />
                Suspend Organization
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-luna-success" />
                Unsuspend Organization
              </>
            )}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {isActive
              ? `Disable access for ${organization.name} and all its members`
              : `Restore access for ${organization.name} and all its members`}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isActive && (
              <>
                <div className="bg-luna-warning-50 border border-luna-warning-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-luna-warning-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-luna-warning-900">
                      <strong>Warning:</strong> Suspending this organization will also suspend all associated users and prevent them from accessing the platform.
                    </p>
                  </div>
                </div>

                <LunaTextarea
                  label="Reason for Suspension"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this organization is being suspended..."
                  rows={4}
                />
              </>
            )}

            {!isActive && (
              <div className="bg-luna-success-50 border border-luna-success-200 rounded-lg p-4">
                <p className="text-sm text-luna-success-900">
                  This organization and all its members will regain full access to the platform.
                </p>
              </div>
            )}
          </form>
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
            type="submit"
            variant={isActive ? 'danger' : 'primary'}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isActive ? 'Suspending...' : 'Unsuspending...'}
              </>
            ) : (
              isActive ? 'Suspend Organization' : 'Unsuspend Organization'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

