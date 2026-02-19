/**
 * Upload Organization Logo Modal
 * Standalone modal for managing organization logo
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
import { Loader2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface UploadOrganizationLogoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data?: { logo_url?: string | null }) => void;
  currentLogoUrl?: string | null;
  organizationId: string;
}

export function UploadOrganizationLogoModal({
  open,
  onOpenChange,
  onSuccess,
  currentLogoUrl,
  organizationId,
}: UploadOrganizationLogoModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [shouldRemove, setShouldRemove] = useState(false);

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLogoFile(null);
      setShouldRemove(false);
      setError('');
    }
    onOpenChange(newOpen);
  };

  // Handle file change from LunaAvatarUpload
  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    // If file is null and we had a current logo, user wants to remove it
    if (file === null && currentLogoUrl) {
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

      // Case 1: User wants to remove logo
      if (shouldRemove && !logoFile) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ logo_url: null })
          .eq('id', organizationId);

        if (updateError) throw updateError;

        setLoading(false);
        onOpenChange(false);
        onSuccess?.({ logo_url: null });
        router.refresh();
        return;
      }

      // Case 2: User wants to upload new logo
      if (!logoFile) {
        setError('Please select an image');
        setLoading(false);
        return;
      }

      // Upload logo
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${organizationId}/logo-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, logoFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(fileName);

      // Update organization profile
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: publicUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      setLoading(false);
      onOpenChange(false);
      onSuccess?.({ logo_url: publicUrl });
      router.refresh();
    } catch (err) {
      console.error('Error uploading logo:', err);
      setError('Failed to upload logo. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={handleOpenChange}>
      <LunaDialogContent className="max-w-md">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Update Company Logo
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Upload a new company logo or remove your current one. Recommended size: 400x400px
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
              value={currentLogoUrl || undefined}
              onChange={handleLogoChange}
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
              disabled={loading || (!logoFile && !shouldRemove)}
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
