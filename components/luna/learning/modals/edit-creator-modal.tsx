/**
 * Edit Creator Modal
 * Modal for editing existing content creators
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
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
  LunaSwitch,
  LunaAvatarUpload,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Creator = Database['public']['Tables']['creators']['Row'];

const CREATOR_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'institution', label: 'Institution' },
  { value: 'organization', label: 'Organization' },
  { value: 'partner', label: 'Partner' },
] as const;

interface EditCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  creator: Creator | null;
}

export function EditCreatorModal({
  open,
  onOpenChange,
  onSuccess,
  creator,
}: EditCreatorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [creatorData, setCreatorData] = useState({
    name: '',
    type: '',
    bio: '',
    logo_url: '',
    website_url: '',
    contact_email: '',
    verified: false,
  });

  // Populate form when creator changes
  useEffect(() => {
    if (creator) {
      setCreatorData({
        name: creator.name || '',
        type: creator.type || '',
        bio: creator.bio || '',
        logo_url: creator.logo_url || '',
        website_url: creator.website_url || '',
        contact_email: creator.contact_email || '',
        verified: creator.verified || false,
      });
    }
  }, [creator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creator) return;

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

      // Upload new logo if file selected
      let logoUrl = creatorData.logo_url;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('creator-logos')
          .upload(filePath, logoFile);

        if (uploadError) {
          setError(`Failed to upload logo: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        // Get the public URL
        const { data } = supabase.storage
          .from('creator-logos')
          .getPublicUrl(filePath);

        logoUrl = data.publicUrl;

        // Delete old logo if it exists and is from our storage
        if (creatorData.logo_url && creatorData.logo_url.includes('creator-logos')) {
          const oldPath = creatorData.logo_url.split('/creator-logos/').pop();
          if (oldPath) {
            await supabase.storage.from('creator-logos').remove([oldPath]);
          }
        }
      }

      const response = await fetch(`/api/learning/creators/${creator.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: creatorData.name,
          type: creatorData.type,
          bio: creatorData.bio || null,
          logo_url: logoUrl || null,
          website_url: creatorData.website_url || null,
          contact_email: creatorData.contact_email || null,
          verified: creatorData.verified,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update creator');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      setLogoFile(null);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating creator:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onOpenChange(false);
    }
  };

  if (!creator) return null;

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Creator
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update creator information
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LunaInput
                label="Creator Name"
                required
                value={creatorData.name}
                onChange={(e) => setCreatorData({ ...creatorData, name: e.target.value })}
                placeholder="e.g., John Doe, Harvard University"
              />

              <LunaSelect
                label="Creator Type"
                required
                value={creatorData.type}
                onValueChange={(value) => setCreatorData({ ...creatorData, type: value })}
                placeholder="Select a type"
              >
                {CREATOR_TYPES.map((type) => (
                  <LunaSelectItem key={type.value} value={type.value}>
                    {type.label}
                  </LunaSelectItem>
                ))}
              </LunaSelect>

              <LunaInput
                label="Contact Email"
                type="email"
                value={creatorData.contact_email || ''}
                onChange={(e) => setCreatorData({ ...creatorData, contact_email: e.target.value })}
                placeholder="contact@example.com"
              />

              <LunaInput
                label="Website URL"
                type="url"
                value={creatorData.website_url || ''}
                onChange={(e) => setCreatorData({ ...creatorData, website_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <LunaAvatarUpload
              label="Creator Logo"
              size="lg"
              value={creatorData.logo_url || undefined}
              helperText="PNG, JPG, SVG or WEBP (max. 2MB)"
              onChange={setLogoFile}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <LunaSwitch
                  id="verified"
                  checked={creatorData.verified}
                  onCheckedChange={(checked) => setCreatorData({ ...creatorData, verified: checked })}
                />
                <label htmlFor="verified" className="text-sm font-medium text-luna-gray-900">
                  Verified Creator
                </label>
              </div>
            </div>

            <LunaTextarea
              label="Bio"
              value={creatorData.bio || ''}
              onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value })}
              placeholder="Brief description about the creator..."
              rows={3}
            />
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
            onClick={handleSubmit}
            disabled={loading || !creatorData.name || !creatorData.type}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Creator...
              </>
            ) : (
              'Update Creator'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

