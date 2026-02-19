/**
 * Edit Team Member Modal
 * For editing platform admin team member information
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
  LunaInput,
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EditTeamMemberModalProps {
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

export function EditTeamMemberModal({
  open,
  onOpenChange,
  onSuccess,
  member,
}: EditTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [memberData, setMemberData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_role: '',
  });
  
  // Update form when member prop changes
  useEffect(() => {
    if (member) {
      setMemberData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        user_role: member.user_role || '',
      });
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

      const response = await fetch('/api/admin/team/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: member.id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          email: memberData.email,
          user_role: memberData.user_role,
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
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Team Member
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update team member information
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <LunaInput
                label="First Name"
                required
                value={memberData.first_name}
                onChange={(e) => setMemberData({ ...memberData, first_name: e.target.value })}
                placeholder="John"
              />
              <LunaInput
                label="Last Name"
                required
                value={memberData.last_name}
                onChange={(e) => setMemberData({ ...memberData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>

            <LunaInput
              label="Email Address"
              type="email"
              required
              value={memberData.email}
              onChange={(e) => setMemberData({ ...memberData, email: e.target.value })}
              placeholder="john.doe@example.com"
            />

            <LunaSelect
              label="Role"
              required
              value={memberData.user_role}
              onValueChange={(value) => setMemberData({ ...memberData, user_role: value })}
            >
              <LunaSelectItem value="super_admin">Super Admin</LunaSelectItem>
              <LunaSelectItem value="moderator">Moderator</LunaSelectItem>
              <LunaSelectItem value="support">Support</LunaSelectItem>
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
            disabled={loading || !memberData.email || !memberData.first_name || !memberData.last_name}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Team Member'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

