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
import { Loader2, Building2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface UploadOrganizationBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data?: { cover_image_url?: string | null }) => void;
  currentBannerUrl?: string | null;
  organizationId: string;
  slug: string;
}

export function UploadOrganizationBannerModal({
  open,
  onOpenChange,
  onSuccess,
  currentBannerUrl,
  organizationId,
  slug,
}: UploadOrganizationBannerModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  // Reset state when modal opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setBannerFile(null);
      setError('');
      setPreviewUrl(null);
      setImageRemoved(false);
    }
    onOpenChange(newOpen);
  };

  // Handle file change
  const handleBannerChange = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setBannerFile(file);
      setImageRemoved(false); // User selected a new file, so image is not removed
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setBannerFile(null);
      setPreviewUrl(null);
    }
  };

  // Handle removing the preview/current banner
  const handleRemoveImage = () => {
    setBannerFile(null);
    setPreviewUrl(null);
    setImageRemoved(true); // Mark that user explicitly removed the image
    // Clean up preview URL if it was created from a file
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      // If no file selected (user removed image or never selected one), remove banner
      if (!bannerFile || imageRemoved) {
        const removeRes = await fetch(`/api/organization/profile?slug=${encodeURIComponent(slug)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_image_url: null }),
        });
        const removeData = await removeRes.json();
        if (!removeRes.ok) {
          throw new Error(removeData.error || 'Failed to remove banner');
        }
        setLoading(false);
        onOpenChange(false);
        onSuccess?.({ cover_image_url: null });
        router.refresh();
        return;
      }

      // Upload new banner
      const supabase = createClient();
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

      // Update organization profile via API (bypasses RLS)
      const updateRes = await fetch(`/api/organization/profile?slug=${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_url: publicUrl }),
      });
      const updateData = await updateRes.json();
      if (!updateRes.ok) {
        throw new Error(updateData.error || 'Failed to update banner');
      }

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
            {(currentBannerUrl || previewUrl) && !imageRemoved && (
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
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition-colors z-10"
                    aria-label="Remove banner"
                  >
                    <X className="w-4 h-4 text-luna-gray-700" />
                  </button>
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
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}
