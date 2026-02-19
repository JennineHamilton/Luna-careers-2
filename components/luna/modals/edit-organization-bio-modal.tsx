/**
 * Edit Organization Bio Modal
 * Simple modal for editing organization description/bio
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
  LunaTextarea,
} from '@/components/luna';
import { Loader2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EditOrganizationBioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBio: string | null;
  slug: string;
  onSuccess?: () => void;
}

export function EditOrganizationBioModal({
  open,
  onOpenChange,
  currentBio,
  slug,
  onSuccess,
}: EditOrganizationBioModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bio, setBio] = useState('');

  // Update bio when modal opens
  useEffect(() => {
    if (open) {
      setBio(currentBio || '');
      setError('');
    }
  }, [open, currentBio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/organization/profile?slug=${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: bio || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update description');
        setLoading(false);
        return;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error updating bio:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Edit Company Description
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Write a description about your company that will be visible to prospects
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <LunaTextarea
              label="Company Description"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell prospects about your company, its mission, values, and what makes it unique..."
              rows={8}
              helperText="This description will be visible on your public profile"
            />
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton type="submit" variant="primary" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Description
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}
