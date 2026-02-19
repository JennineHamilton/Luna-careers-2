/**
 * Edit User Modal
 * For editing user information (platform admin only)
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

interface EditUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    user_role: string;
  } | null;
}

export function EditUserModal({
  open,
  onOpenChange,
  onSuccess,
  user,
}: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    user_role: '',
  });

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setUserData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        user_role: user.user_role || '',
      });
    }
  }, [user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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

      const response = await fetch('/api/admin/users/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          email: userData.email,
          user_role: userData.user_role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update user');
        setLoading(false);
        return;
      }

      // Success
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating user:', err);
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
  
  if (!user) return null;
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update user information
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
            />

            <LunaSelect
              label="Role"
              required
              value={userData.user_role}
              onValueChange={(value) => setUserData({ ...userData, user_role: value })}
            >
              <LunaSelectItem value="candidate">Candidate</LunaSelectItem>
              <LunaSelectItem value="premium_member">Premium Member</LunaSelectItem>
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
            disabled={loading || !userData.email || !userData.first_name || !userData.last_name}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update User'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

