/**
 * Add/Edit Organization Benefit Modal
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
} from '@/components/luna';
import { Loader2, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database.types';

type OrganizationBenefit = Database['public']['Tables']['organization_benefits']['Row'];

interface AddBenefitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  benefit?: OrganizationBenefit | null;
  onSuccess?: () => void;
}

export function AddBenefitModal({
  open,
  onOpenChange,
  organizationId,
  benefit,
  onSuccess,
}: AddBenefitModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [benefitName, setBenefitName] = useState('');
  const [description, setDescription] = useState('');

  // Reset form when modal opens/closes or benefit changes
  useEffect(() => {
    if (open) {
      if (benefit) {
        setBenefitName(benefit.benefit_name || '');
        setDescription(benefit.description || '');
      } else {
        setBenefitName('');
        setDescription('');
      }
      setError('');
    }
  }, [open, benefit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!benefitName.trim()) {
      setError('Benefit name is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      if (benefit) {
        // Update existing benefit
        const { error: updateError } = await supabase
          .from('organization_benefits')
          .update({
            benefit_name: benefitName.trim(),
            description: description.trim() || null,
          })
          .eq('id', benefit.id);

        if (updateError) throw updateError;
      } else {
        // Get max sort_order for this organization
        const { data: existingBenefits } = await supabase
          .from('organization_benefits')
          .select('sort_order')
          .eq('organization_id', organizationId)
          .order('sort_order', { ascending: false })
          .limit(1);

        const nextSortOrder = existingBenefits && existingBenefits.length > 0
          ? (existingBenefits[0].sort_order || 0) + 1
          : 1;

        // Insert new benefit
        const { error: insertError } = await supabase
          .from('organization_benefits')
          .insert({
            organization_id: organizationId,
            benefit_name: benefitName.trim(),
            description: description.trim() || null,
            sort_order: nextSortOrder,
          });

        if (insertError) throw insertError;
      }

      setLoading(false);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error saving benefit:', err);
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
              <Award className="w-5 h-5" />
              {benefit ? 'Edit Benefit' : 'Add Benefit'}
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            {benefit
              ? 'Update the company benefit information'
              : 'Add a new benefit that your company offers to employees'}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody>
            <div className="space-y-4">
              {error && (
                <div className="p-3 bg-luna-red-50 border border-luna-red-200 rounded-lg text-sm text-luna-red-700">
                  {error}
                </div>
              )}

              <LunaInput
                label="Benefit Name"
                required
                value={benefitName}
                onChange={(e) => setBenefitName(e.target.value)}
                placeholder="e.g., Health Insurance, Paid Time Off"
                helperText="The name of the benefit"
              />

              <LunaTextarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional: Add more details about this benefit..."
                rows={4}
                helperText="Optional: Provide additional details about this benefit"
              />
            </div>
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
              {benefit ? 'Update Benefit' : 'Add Benefit'}
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}
