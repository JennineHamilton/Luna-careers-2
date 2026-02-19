'use client';

/**
 * Skill Form Component
 * Form for creating/editing skills
 */

import { useState } from 'react';
import { LunaInput, LunaTextarea, LunaButton, LunaSelect } from '@/components/luna';
import type { Database } from '@/types/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];
type SkillInsert = Database['public']['Tables']['skills']['Insert'];

export interface SkillFormProps {
  initialData?: Skill;
  onSubmit: (data: SkillInsert) => Promise<void>;
  onCancel?: () => void;
}

export function SkillForm({ initialData, onSubmit, onCancel }: SkillFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SkillInsert>({
    name: initialData?.name || '',
    category: initialData?.category || 'technical',
    description: initialData?.description || null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <LunaInput
        label="Skill Name"
        placeholder="e.g., JavaScript, Project Management"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
      />

      <LunaInput
        label="Category"
        placeholder="e.g., Programming, Soft Skills"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
        required
      />

      <LunaTextarea
        label="Description"
        placeholder="Brief description of this skill..."
        value={formData.description || ''}
        onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
        rows={3}
      />

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <LunaButton type="button" variant="outline" onClick={onCancel}>
            Cancel
          </LunaButton>
        )}
        <LunaButton type="submit" loading={loading}>
          {initialData ? 'Update Skill' : 'Create Skill'}
        </LunaButton>
      </div>
    </form>
  );
}

