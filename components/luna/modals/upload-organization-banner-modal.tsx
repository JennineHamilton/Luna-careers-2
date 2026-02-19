/**
 * Upload Organization Banner Modal
 * Standalone modal for managing organization banner
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
  LunaFileUpload,
} from '@/components/luna';
import { Loader2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UploadOrganizationBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data?: { cover_image_url?: string | null }) => void;
  currentBannerUrl?: string | null;
  organizationId: string;
}

export function UploadOrganizationBannerModal({
  open,
  onOpenChange,
  onSuccess,
  currentBannerUrl,
  organizationId,
}: UploadOrganizationBannerModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [shouldRemove, setShouldRemove] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setBannerFile(null);
      setShouldRemove(false);
      setError('');
      setPreviewUrl(null);
    }
    onOpenChange(newOpen);
  };

  // Handle file change
  const handleBannerChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setBannerFile(file);
      setShouldRemove(false);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setBannerFile(null);
      setPreviewUrl(null);
      if (currentBannerUrl) {
        setShouldRemove(true);
      }
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

      // Case 1: User wants to remove banner
      if (shouldRemove && !bannerFile) {
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ cover_image_url: null })
          .eq('id', organizationId);

        if (updateError) throw updateError;

        setLoading(false);
        onOpenChange(false);
        onSuccess?.({ cover_image_url: null });
        router.refresh();
        return;
      }

      // Case 2: User wants to upload new banner
      if (!bannerFile) {
        setError('Please select an image');
        setLoading(false);
        return;
      }

      // Upload banner
      const fileExt = bannerFile.name.split('.').pop();
      const fileName = `${organizationId}/banner-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('organization-assets')
        .upload(fileName, bannerFile, {
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
        .update({ cover_image_url: publicUrl })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      setLoading(false);
      onOpenChange(false);
      onSuccess?.({ cover_image_url: publicUrl });
      router.refresh();
    } catch (err) {
      console.error('Error uploading banner:', err);
      setError('Failed to upload banner. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={handleOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Update Company Banner
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Upload a new company banner or remove your current one. Recommended size: 1920x400px
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Current Banner Preview */}
            {(currentBannerUrl || previewUrl) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-luna-gray-900 mb-2">
                  {previewUrl ? 'Preview' : 'Current Banner'}
                </label>
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-luna-border-light">
                  <Image
                    src={previewUrl || currentBannerUrl || ''}
                    alt="Company banner"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            <LunaFileUpload
              label="Upload Banner Image"
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              onFilesChange={handleBannerChange}
              helperText="PNG, JPG, or WEBP (max. 5MB). Recommended: 1920x400px"
            />

            {currentBannerUrl && !previewUrl && (
              <div className="mt-4">
                <LunaButton
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShouldRemove(true);
                    setBannerFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={loading}
                >
                  Remove Current Banner
                </LunaButton>
              </div>
            )}
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
              disabled={loading || (!bannerFile && !shouldRemove)}
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
