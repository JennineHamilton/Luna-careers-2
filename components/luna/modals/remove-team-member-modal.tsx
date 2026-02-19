/**
 * Remove Team Member Modal
 * For permanently removing platform admin team members (super admin only)
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
  LunaInput,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RemoveTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  member: {
    id: string;
    name: string;
  } | null;
}

export function RemoveTeamMemberModal({
  open,
  onOpenChange,
  onSuccess,
  member,
}: RemoveTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    
    if (confirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
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
      
      const response = await fetch('/api/admin/team/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: member.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to remove team member');
        setLoading(false);
        return;
      }
      
      // Success
      onSuccess?.();
      onOpenChange(false);
      setConfirmation('');
    } catch (err) {
      console.error('Error removing team member:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    if (!loading) {
      setError('');
      setConfirmation('');
      onOpenChange(false);
    }
  };
  
  if (!member) return null;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-luna-error" />
            Remove Team Member
          </LunaDialogTitle>
          <LunaDialogDescription>
            Permanently remove {member.name} from the platform
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-luna-error-50 border border-luna-error-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertTriangle className="h-5 w-5 text-luna-error-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-luna-error-900 font-semibold">
                    This action cannot be undone!
                  </p>
                  <p className="text-sm text-luna-error-900">
                    Removing this team member will:
                  </p>
                  <ul className="text-sm text-luna-error-900 list-disc list-inside space-y-1">
                    <li>Permanently delete their account</li>
                    <li>Remove all their access to the platform</li>
                    <li>Delete all associated data</li>
                  </ul>
                </div>
              </div>
            </div>

            <LunaInput
              label={`Type "DELETE" to confirm removal of ${member.name}`}
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
            />
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
            variant="danger"
            disabled={loading || confirmation !== 'DELETE'}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove Team Member'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

