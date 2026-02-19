/**
 * Suspend User Modal
 * For suspending/unsuspending user accounts (platform admin only)
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
import { Loader2, Ban, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SuspendUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  user: {
    id: string;
    name: string;
    is_suspended?: boolean;
  } | null;
}

export function SuspendUserModal({
  open,
  onOpenChange,
  onSuccess,
  user,
}: SuspendUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  
  const isSuspended = user?.is_suspended || false;
  const action = isSuspended ? 'unsuspend' : 'suspend';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!isSuspended && !reason.trim()) {
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
      
      const response = await fetch('/api/admin/users/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          suspend: !isSuspended,
          reason: reason.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || `Failed to ${action} user`);
        setLoading(false);
        return;
      }
      
      // Success
      onSuccess?.();
      onOpenChange(false);
      setReason('');
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
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
  
  if (!user) return null;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            {isSuspended ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-luna-success" />
                Unsuspend User
              </>
            ) : (
              <>
                <Ban className="h-5 w-5 text-luna-error" />
                Suspend User
              </>
            )}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {isSuspended
              ? `Restore access for ${user.name}`
              : `Temporarily disable access for ${user.name}`}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSuspended && (
              <LunaTextarea
                label="Reason for Suspension"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this user is being suspended..."
                rows={4}
              />
            )}

            {isSuspended && (
              <div className="bg-luna-success-50 border border-luna-success-200 rounded-lg p-4">
                <p className="text-sm text-luna-success-900">
                  This user will regain full access to their account.
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
            variant={isSuspended ? 'primary' : 'danger'}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSuspended ? 'Unsuspending...' : 'Suspending...'}
              </>
            ) : (
              isSuspended ? 'Unsuspend User' : 'Suspend User'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

