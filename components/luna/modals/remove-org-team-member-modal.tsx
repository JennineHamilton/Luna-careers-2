/**
 * Remove Organization Team Member Modal
 * For disconnecting team members from organization (organization admin only)
 * This does NOT delete the user account - it converts them to a personal account
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
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserMinus, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface RemoveOrgTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export function RemoveOrgTeamMemberModal({
  open,
  onOpenChange,
  onSuccess,
  member,
}: RemoveOrgTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    
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
      
      const response = await fetch('/api/organization/team/remove', {
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
      onOpenChange(false);
    }
  };
  
  if (!member) return null;
  
  const memberName = `${member.first_name} ${member.last_name}`;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5 text-luna-warning" />
            Remove Team Member
          </LunaDialogTitle>
          <LunaDialogDescription>
            Disconnect {memberName} from your organization
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-luna-warning-50 border border-luna-warning-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-luna-warning-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-luna-warning-900 font-semibold">
                  This will disconnect the team member from your organization
                </p>
                <p className="text-sm text-luna-warning-900">
                  Removing {memberName} will:
                </p>
                <ul className="text-sm text-luna-warning-900 list-disc list-inside space-y-1">
                  <li>Remove their access to your organization portal</li>
                  <li>Convert their account to a personal account</li>
                  <li>They will retain access to their personal portal</li>
                  <li>Their user account will NOT be deleted</li>
                </ul>
              </div>
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
            type="submit"
            variant="danger"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              'Remove from Organization'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

