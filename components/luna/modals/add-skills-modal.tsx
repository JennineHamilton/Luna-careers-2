/**
 * Add/Manage Skills Modal
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
  LunaCombobox,
  LunaBadge,
} from '@/components/luna';
import { Loader2, Lightbulb, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Database } from '@/types/database.types';

type Skill = Database['public']['Tables']['skills']['Row'];
type UserSkill = Database['public']['Tables']['user_skills']['Row'];

interface AddSkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddSkillsModal({ open, onOpenChange, onSuccess }: AddSkillsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<(UserSkill & { skill_name: string })[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch all available skills
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('*')
      .order('name');

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      setError('Failed to load skills');
    } else if (skillsData) {
      console.log('Fetched skills:', skillsData.length);
      setAllSkills(skillsData);
    }

    // Fetch user's current skills
    const { data: userSkillsData, error: userSkillsError } = await supabase
      .from('user_skills')
      .select(`
        *,
        skills!inner(name)
      `)
      .eq('user_id', user.id);

    if (userSkillsError) {
      console.error('Error fetching user skills:', userSkillsError);
    } else if (userSkillsData) {
      const formattedSkills = userSkillsData.map(us => ({
        ...us,
        skill_name: (us.skills as any).name
      }));
      console.log('User skills:', formattedSkills.length);
      setUserSkills(formattedSkills);
    }
  };

  const handleSave = async () => {
    // If no new skills to add, just close the modal
    if (selectedSkillIds.length === 0) {
      onOpenChange(false);
      setSelectedSkillIds([]);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // Insert new skills
      const { error: insertError } = await supabase
        .from('user_skills')
        .insert(
          selectedSkillIds.map(skillId => ({
            user_id: user.id,
            skill_id: skillId,
          }))
        );

      if (insertError) throw insertError;

      setLoading(false);
      setSelectedSkillIds([]);
      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (err) {
      console.error('Error adding skills:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteSkill = async (userSkillId: string) => {
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('user_skills')
        .delete()
        .eq('id', userSkillId);

      if (deleteError) throw deleteError;

      // Update local state
      setUserSkills(userSkills.filter(us => us.id !== userSkillId));
      router.refresh();
    } catch (err) {
      console.error('Error deleting skill:', err);
      setError('Failed to delete skill');
    }
  };

  // Filter out skills the user already has
  const availableSkills = allSkills.filter(
    skill => !userSkills.some(us => us.skill_id === skill.id)
  );

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <LunaDialogTitle>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Manage Skills
            </div>
          </LunaDialogTitle>
          <LunaDialogDescription>
            Add or remove skills from your profile
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-luna-red-50 border border-luna-red-200 rounded-lg text-sm text-luna-red-700">
                {error}
              </div>
            )}

            {/* Current Skills */}
            {userSkills.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-luna-gray-900 mb-2">
                  Your Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {userSkills.map((userSkill) => (
                    <LunaBadge
                      key={userSkill.id}
                      variant="default"
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5"
                    >
                      <span>{userSkill.skill_name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(userSkill.id)}
                        className="hover:bg-luna-gray-300 rounded-sm p-0.5 transition-colors"
                        aria-label="Remove skill"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </LunaBadge>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Skills */}
            <div>
              <LunaCombobox
                label="Add Skills"
                options={availableSkills.map(skill => ({
                  value: skill.id,
                  label: skill.name,
                }))}
                value={selectedSkillIds}
                onChange={setSelectedSkillIds}
                placeholder="Select skills to add..."
                searchPlaceholder="Search skills..."
                helperText="Select one or more skills from the list"
              />
            </div>
          </div>
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton
            type="button"
            variant="secondary"
            onClick={() => {
              onOpenChange(false);
              setSelectedSkillIds([]);
            }}
            disabled={loading}
          >
            Cancel
          </LunaButton>
          <LunaButton
            onClick={handleSave}
            variant="primary"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {selectedSkillIds.length > 0
              ? `Add (${selectedSkillIds.length}) Skill${selectedSkillIds.length !== 1 ? 's' : ''}`
              : 'Done'
            }
          </LunaButton>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

