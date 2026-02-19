/**
 * Upload Avatar Modal
 * Standalone modal for managing profile picture
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
  LunaAvatarUpload,
} from '@/components/luna';
import { Loader2, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UploadAvatarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentAvatarUrl?: string | null;
  userId: string;
}

export function UploadAvatarModal({
  open,
  onOpenChange,
  onSuccess,
  currentAvatarUrl,
  userId,
}: UploadAvatarModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [shouldRemove, setShouldRemove] = useState(false);

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAvatarFile(null);
      setShouldRemove(false);
      setError('');
    }
    onOpenChange(newOpen);
  };

  // Handle file change from LunaAvatarUpload
  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    // If file is null and we had a current avatar, user wants to remove it
    if (file === null && currentAvatarUrl) {
      setShouldRemove(true);
    } else {
      setShouldRemove(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      // Case 1: User wants to remove avatar
      if (shouldRemove && !avatarFile) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ avatar_url: null })
          .eq('id', userId);

        if (updateError) throw updateError;

        setLoading(false);
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
        return;
      }

      // Case 2: User wants to upload new avatar
      if (!avatarFile) {
        setError('Please select an image');
        setLoading(false);
        return;
      }

      // Upload avatar
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-credentials')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-credentials')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={handleOpenChange}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Update Profile Picture
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Upload a new profile picture or remove your current one. Recommended size: 400x400px
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <LunaAvatarUpload
              value={currentAvatarUrl || undefined}
              onChange={handleAvatarChange}
            />
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton
              type="submit"
              variant="primary"
              disabled={loading || (!avatarFile && !shouldRemove)}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {shouldRemove ? 'Remove' : 'Upload'}
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

