/**
 * Invite Team Member Modal
 * For organization admins to invite team members to their organization
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
  LunaSelect,
  LunaSelectItem,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface InviteTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  organizationId: string;
  organizationName: string;
}

export function InviteTeamMemberModal({
  open,
  onOpenChange,
  onSuccess,
  organizationId,
  organizationName,
}: InviteTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [memberData, setMemberData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    user_role: 'organization_member',
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...memberData,
          account_type: 'hybrid', // All organization members are hybrid
          organization_id: organizationId,
          organization_name: organizationName,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to invite team member');
        setLoading(false);
        return;
      }
      
      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error inviting team member:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setMemberData({
      email: '',
      first_name: '',
      last_name: '',
      user_role: 'organization_member',
    });
    setError('');
    onOpenChange(false);
  };
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Team Member
          </LunaDialogTitle>
          <LunaDialogDescription>
            Invite a new member to join {organizationName}
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
              helperText="An invitation email will be sent to this address"
            />

            <LunaSelect
              label="Role"
              required
              value={memberData.user_role}
              onValueChange={(value) => setMemberData({ ...memberData, user_role: value })}
            >
              <LunaSelectItem value="organization_member">Organization Member</LunaSelectItem>
              <LunaSelectItem value="recruiter">Recruiter</LunaSelectItem>
              <LunaSelectItem value="hr_manager">HR Manager</LunaSelectItem>
              <LunaSelectItem value="hiring_manager">Hiring Manager</LunaSelectItem>
              <LunaSelectItem value="org_admin">Organization Admin</LunaSelectItem>
            </LunaSelect>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This user will be created as a <strong>hybrid account</strong>, giving them access to both personal and organization portals. They can switch between contexts using the context switcher.
              </p>
            </div>
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
                Sending Invitation...
              </>
            ) : (
              'Send Invitation'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

