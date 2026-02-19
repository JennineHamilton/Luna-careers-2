/**
 * Edit Organization Team Member Modal
 * For editing organization team member roles (organization admin only)
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
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EditOrgTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  member: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_role: string;
  } | null;
}

export function EditOrgTeamMemberModal({
  open,
  onOpenChange,
  onSuccess,
  member,
}: EditOrgTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  
  // Update form when member prop changes
  useEffect(() => {
    if (member) {
      setUserRole(member.user_role || '');
    }
  }, [member]);
  
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

      const response = await fetch('/api/organization/team/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: member.id,
          user_role: userRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update team member');
        setLoading(false);
        return;
      }

      // Success
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating team member:', err);
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
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Team Member Role
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update role for {member.first_name} {member.last_name}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <LunaSelect
              label="Role"
              required
              value={userRole}
              onValueChange={setUserRole}
            >
              <LunaSelectItem value="organization_member">Member</LunaSelectItem>
              <LunaSelectItem value="recruiter">Recruiter</LunaSelectItem>
              <LunaSelectItem value="hiring_manager">Hiring Manager</LunaSelectItem>
              <LunaSelectItem value="hr_manager">HR Manager</LunaSelectItem>
              <LunaSelectItem value="org_admin">Organization Admin</LunaSelectItem>
            </LunaSelect>
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
            disabled={loading || !userRole}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Role'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

