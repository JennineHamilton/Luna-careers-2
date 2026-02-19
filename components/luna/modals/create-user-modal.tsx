/**
 * Create User Modal
 * For creating personal users or platform admin team members
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
import { Loader2, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** If true, creates platform admin. If false, creates personal user */
  isPlatformAdmin?: boolean;
}

export function CreateUserModal({
  open,
  onOpenChange,
  onSuccess,
  isPlatformAdmin = false,
}: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userData, setUserData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    user_role: isPlatformAdmin ? 'moderator' : 'candidate',
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
          ...userData,
          account_type: isPlatformAdmin ? 'platformAdmin' : 'personal',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to create user');
        setLoading(false);
        return;
      }
      
      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setUserData({
      email: '',
      first_name: '',
      last_name: '',
      user_role: isPlatformAdmin ? 'moderator' : 'candidate',
    });
    setError('');
    onOpenChange(false);
  };
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isPlatformAdmin ? 'Invite Platform Team Member' : 'Create Personal User'}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {isPlatformAdmin
              ? 'Invite a new member to the platform admin team'
              : 'Create a new personal/jobseeker account'}
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
                value={userData.first_name}
                onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
                placeholder="John"
              />

              <LunaInput
                label="Last Name"
                required
                value={userData.last_name}
                onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
                placeholder="Doe"
              />
            </div>

            <LunaInput
              label="Email Address"
              type="email"
              required
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              placeholder="john.doe@example.com"
              helperText="An invitation email will be sent to this address"
            />

            <LunaSelect
              label="Role"
              required
              value={userData.user_role}
              onValueChange={(value) => setUserData({ ...userData, user_role: value })}
            >
              {isPlatformAdmin ? (
                <>
                  <LunaSelectItem value="super_admin">Super Admin</LunaSelectItem>
                  <LunaSelectItem value="moderator">Moderator</LunaSelectItem>
                  <LunaSelectItem value="support">Support</LunaSelectItem>
                </>
              ) : (
                <>
                  <LunaSelectItem value="candidate">Candidate</LunaSelectItem>
                  <LunaSelectItem value="premium_member">Premium Member</LunaSelectItem>
                </>
              )}
            </LunaSelect>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> The user will receive an invitation email with a temporary password. They must activate their account within 7 days.
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
            disabled={loading || !userData.email || !userData.first_name || !userData.last_name}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating & Sending Invitation...
              </>
            ) : (
              'Create User & Send Invitation'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

