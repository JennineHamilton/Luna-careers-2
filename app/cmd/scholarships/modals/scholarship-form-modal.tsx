'use client';

import { useState, useEffect } from 'react';
import { LunaDialog, LunaDialogContent, LunaDialogHeader, LunaDialogTitle, LunaDialogDescription, LunaDialogBody, LunaDialogFooter } from '@/components/luna/dialog';
import { LunaButton } from '@/components/luna/button';
import { LunaInput, LunaInputLabel } from '@/components/luna/input';
import { LunaTextarea } from '@/components/luna/textarea';
import { LunaSelect, LunaSelectItem } from '@/components/luna/select';
import { LunaSwitch } from '@/components/luna/switch';
import { Award, Loader2 } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];

interface ScholarshipFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scholarship: Scholarship | null;
  onSuccess: (scholarship: Scholarship) => void;
}

export function ScholarshipFormModal({
  open,
  onOpenChange,
  scholarship,
  onSuccess,
}: ScholarshipFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'full' as 'full' | 'partial',
    discount_percentage: 100,
    total_slots: null as number | null,
    is_active: true,
    valid_from: null as string | null,
    valid_until: null as string | null,
  });

  useEffect(() => {
    if (scholarship) {
      setFormData({
        name: scholarship.name,
        description: scholarship.description || '',
        type: scholarship.type as 'full' | 'partial',
        discount_percentage: scholarship.discount_percentage,
        total_slots: scholarship.total_slots,
        is_active: scholarship.is_active ?? true,
        valid_from: scholarship.valid_from ? new Date(scholarship.valid_from).toISOString().split('T')[0] : null,
        valid_until: scholarship.valid_until ? new Date(scholarship.valid_until).toISOString().split('T')[0] : null,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'full',
        discount_percentage: 100,
        total_slots: null,
        is_active: true,
        valid_from: null,
        valid_until: null,
      });
    }
  }, [scholarship, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in');
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        discount_percentage: formData.discount_percentage,
        total_slots: formData.total_slots,
        slots_remaining: formData.total_slots,
        is_active: formData.is_active,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      };

      const url = scholarship
        ? `/api/learning/scholarships/${scholarship.id}`
        : '/api/learning/scholarships';
      
      const method = scholarship ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save scholarship');
      }

      const { scholarship: savedScholarship } = await response.json();
      onSuccess(savedScholarship);
    } catch (error) {
      console.error('Error saving scholarship:', error);
      alert(error instanceof Error ? error.message : 'Failed to save scholarship');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    const type = value as 'full' | 'partial';
    setFormData({
      ...formData,
      type,
      discount_percentage: type === 'full' ? 100 : 50,
    });
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {scholarship ? 'Edit Scholarship' : 'Create Scholarship'}
          </LunaDialogTitle>
          <LunaDialogDescription>
            {scholarship ? 'Update scholarship program details' : 'Create a new scholarship program'}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <form onSubmit={handleSubmit}>
          <LunaDialogBody className="text-sm">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <LunaInputLabel htmlFor="name" required>Scholarship Name</LunaInputLabel>
                <LunaInput
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Full Tuition Scholarship"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <LunaInputLabel htmlFor="description" required>Description</LunaInputLabel>
                <LunaTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scholarship program..."
                  rows={3}
                  required
                />
              </div>

              {/* Type and Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LunaSelect
                    label="Type"
                    required
                    value={formData.type}
                    onValueChange={handleTypeChange}
                    placeholder="Select type"
                  >
                    <LunaSelectItem value="full">Full Scholarship</LunaSelectItem>
                    <LunaSelectItem value="partial">Partial Scholarship</LunaSelectItem>
                  </LunaSelect>
                </div>

                <div>
                  <LunaInputLabel htmlFor="discount_percentage" required>Discount Percentage</LunaInputLabel>
                  <LunaInput
                    id="discount_percentage"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              {/* Total Slots */}
              <div>
                <LunaInputLabel htmlFor="total_slots">Total Slots (leave empty for unlimited)</LunaInputLabel>
                <LunaInput
                  id="total_slots"
                  type="number"
                  min="1"
                  value={formData.total_slots || ''}
                  onChange={(e) => setFormData({ ...formData, total_slots: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Unlimited"
                />
              </div>

              {/* Validity Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <LunaInputLabel htmlFor="valid_from">Valid From</LunaInputLabel>
                  <LunaInput
                    id="valid_from"
                    type="date"
                    value={formData.valid_from || ''}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value || null })}
                  />
                </div>

                <div>
                  <LunaInputLabel htmlFor="valid_until">Valid Until</LunaInputLabel>
                  <LunaInput
                    id="valid_until"
                    type="date"
                    value={formData.valid_until || ''}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || null })}
                  />
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-luna-gray-50 rounded-lg">
                <div>
                  <LunaInputLabel className="mb-0">Active Status</LunaInputLabel>
                  <p className="text-xs text-luna-gray-600 mt-1">
                    {formData.is_active ? 'Scholarship is active and accepting applications' : 'Scholarship is inactive'}
                  </p>
                </div>
                <LunaSwitch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </LunaDialogBody>

          <LunaDialogFooter>
            <LunaButton
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </LunaButton>
            <LunaButton type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {scholarship ? 'Update Scholarship' : 'Create Scholarship'}
            </LunaButton>
          </LunaDialogFooter>
        </form>
      </LunaDialogContent>
    </LunaDialog>
  );
}

