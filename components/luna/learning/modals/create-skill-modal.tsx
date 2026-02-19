/**
 * Create Skill Modal
 * Modal for creating new skills
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
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

type SkillInsert = Database['public']['Tables']['skills']['Insert'];

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

interface CreateSkillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateSkillModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateSkillModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [skillData, setSkillData] = useState<SkillInsert>({
    name: '',
    category: 'technical',
    description: null,
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

      const response = await fetch('/api/learning/skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(skillData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create skill');
        setLoading(false);
        return;
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating skill:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSkillData({
      name: '',
      category: 'technical',
      description: null,
    });
    setError('');
    onOpenChange(false);
  };

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-lg">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create New Skill
          </LunaDialogTitle>
          <LunaDialogDescription>
            Add a new skill to the learning platform
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
              onChange={(e) => setSkillData({ ...skillData, description: e.target.value || null })}
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
            disabled={loading || !skillData.name || !skillData.category}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Skill...
              </>
            ) : (
              'Create Skill'
            )}
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

