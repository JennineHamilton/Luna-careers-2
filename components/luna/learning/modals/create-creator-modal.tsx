/**
 * Create Creator Modal
 * Modal for creating new content creators
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
  LunaTextarea,
  LunaSelect,
  LunaSelectItem,
  LunaSwitch,
  LunaAvatarUpload,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type CreatorInsert = Database['public']['Tables']['creators']['Insert'];

const CREATOR_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'institution', label: 'Institution' },
  { value: 'organization', label: 'Organization' },
  { value: 'partner', label: 'Partner' },
] as const;

interface CreateCreatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCreatorModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCreatorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [creatorData, setCreatorData] = useState<CreatorInsert>({
    name: '',
    type: '',
    bio: null,
    logo_url: null,
    website_url: null,
    contact_email: null,
    verified: false,
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

      // Upload logo if file selected
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
      }

      const response = await fetch('/api/learning/creators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...creatorData,
          logo_url: logoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create creator');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating creator:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCreatorData({
      name: '',
      type: '',
      bio: null,
      logo_url: null,
      website_url: null,
      contact_email: null,
      verified: false,
    });
    setLogoFile(null);
    setError('');
    onOpenChange(false);
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Create New Creator
          </LunaDialogTitle>
          <LunaDialogDescription>
            Add a new content creator to the learning platform
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
                onChange={(e) => setCreatorData({ ...creatorData, contact_email: e.target.value || null })}
                placeholder="contact@example.com"
              />

              <LunaInput
                label="Website URL"
                type="url"
                value={creatorData.website_url || ''}
                onChange={(e) => setCreatorData({ ...creatorData, website_url: e.target.value || null })}
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
                  checked={creatorData.verified || false}
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
              onChange={(e) => setCreatorData({ ...creatorData, bio: e.target.value || null })}
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
            disabled={loading || !creatorData.name || !creatorData.type}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Creator...
              </>
            ) : (
              'Create Creator'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

