/**
 * Edit Skill Modal
 * Modal for editing existing skills
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
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Edit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];

// Skill categories with display labels
const SKILL_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'soft_skill', label: 'Soft Skill' },
  { value: 'industry_specific', label: 'Industry Specific' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'data_analytics', label: 'Data Analytics' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'communication', label: 'Communication' },
  { value: 'digital_literacy', label: 'Digital Literacy' },
] as const;

interface EditSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  skill: Skill | null;
}

export function EditSkillModal({
  open,
  onOpenChange,
  onSuccess,
  skill,
}: EditSkillModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [skillData, setSkillData] = useState({
    name: '',
    category: 'technical' as Database['public']['Enums']['skill_category'],
    description: '',
  });

  // Populate form when skill changes
  useEffect(() => {
    if (skill) {
      setSkillData({
        name: skill.name || '',
        category: skill.category || 'technical',
        description: skill.description || '',
      });
    }
  }, [skill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skill) return;

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

      const response = await fetch(`/api/learning/skills/${skill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: skillData.name,
          category: skillData.category,
          description: skillData.description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update skill');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating skill:', err);
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

  if (!skill) return null;

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-lg">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Skill
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update skill information
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <LunaInput
              label="Skill Name"
              required
              value={skillData.name}
              onChange={(e) => setSkillData({ ...skillData, name: e.target.value })}
              placeholder="e.g., JavaScript, Project Management"
            />

            <LunaSelect
              label="Category"
              required
              value={skillData.category}
              onValueChange={(value) => setSkillData({ ...skillData, category: value as Database['public']['Enums']['skill_category'] })}
              placeholder="Select a category"
            >
              {SKILL_CATEGORIES.map((category) => (
                <LunaSelectItem key={category.value} value={category.value}>
                  {category.label}
                </LunaSelectItem>
              ))}
            </LunaSelect>

            <LunaTextarea
              label="Description"
              value={skillData.description || ''}
              onChange={(e) => setSkillData({ ...skillData, description: e.target.value || '' })}
              placeholder="A short, motivational description that inspires learners..."
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
            disabled={loading || !skillData.name || !skillData.category}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Skill...
              </>
            ) : (
              'Update Skill'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

