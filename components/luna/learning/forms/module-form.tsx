'use client';

/**
 * Module Form Component
 * Form for creating/editing modules with file uploads and lesson selection
 */

import { useState, useEffect } from 'react';
import {
  LunaInput,
  LunaTextarea,
  LunaButton,
  LunaSelect,
  LunaSelectItem,
  LunaSwitch,
  LunaMultiTextInput,
  LunaCombobox,
} from '@/components/luna';
import { LunaFileUpload } from '@/components/luna/file-upload';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaLessonSelector, type SelectedLesson } from '@/components/luna/learning/lesson-selector';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];
type Skill = Database['public']['Tables']['skills']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

export interface ModuleFormData {
  title: string;
  description: string;
  level: string;
  price: number; // Changed from price_credits to price (dollars)
  is_free: boolean;
  scholarship_eligible: boolean;
  is_published: boolean;
  creator_id: string | null;
  // File uploads
  coverImageFile?: File | null;
  introVideoFile?: File | null;
  // Arrays
  outcomes: string[];
  requirements: string[];
  skills: string[]; // skill IDs
  lessons: SelectedLesson[];
}

export interface ModuleFormProps {
  initialData?: Module;
  initialLessons?: SelectedLesson[];
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function ModuleForm({ initialData, initialLessons = [], onSubmit, onCancel, loading: externalLoading }: ModuleFormProps) {
  const [loading, setLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : loading;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  
  const [formData, setFormData] = useState<ModuleFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    level: initialData?.level || 'beginner',
    price: initialData?.price || 0,
    is_free: initialData?.is_free || false,
    scholarship_eligible: initialData?.scholarship_eligible || false,
    is_published: initialData?.is_published || false,
    creator_id: initialData?.creator_id || null,
    coverImageFile: null,
    introVideoFile: null,
    outcomes: Array.isArray(initialData?.learning_outcomes)
      ? (initialData.learning_outcomes as Array<string | { outcome_text: string }>).map(o => typeof o === 'string' ? o : o.outcome_text || '')
      : [],
    requirements: initialData?.requirements ? [initialData.requirements] : [],
    skills: Array.isArray(initialData?.skills)
      ? (initialData.skills as Array<string | { id: string }>).map(s => typeof s === 'string' ? s : s.id || '')
      : [],
    lessons: initialLessons,
  });

  // Fetch skills, lessons, and creators on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch skills
        const skillsRes = await fetch('/api/learning/skills');
        const skillsData = await skillsRes.json();
        setSkills(skillsData.skills || []);

        // Fetch lessons
        const lessonsRes = await fetch('/api/learning/lessons?published_only=false');
        const lessonsData = await lessonsRes.json();
        setLessons(lessonsData.lessons || []);

        // Fetch creators
        const creatorsRes = await fetch('/api/learning/creators');
        const creatorsData = await creatorsRes.json();
        setCreators(creatorsData.creators || []);
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const skillOptions = skills.map((skill) => ({
    value: skill.id,
    label: `${skill.name} (${skill.category})`,
  }));

  const creatorOptions = creators.map((creator) => ({
    value: creator.id,
    label: creator.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info */}
      <div className="space-y-4">
        <LunaInput
          label="Module Title"
          placeholder="e.g., Introduction to React"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />

        <LunaTextarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the module..."
          rows={4}
          required
        />

        {/* Level + Creator side by side */}
        <div className="grid grid-cols-2 gap-4">
          <LunaSelect
            label="Level"
            value={formData.level}
            onValueChange={(value) => setFormData({ ...formData, level: value })}
          >
            <LunaSelectItem value="beginner">Beginner</LunaSelectItem>
            <LunaSelectItem value="intermediate">Intermediate</LunaSelectItem>
            <LunaSelectItem value="advanced">Advanced</LunaSelectItem>
          </LunaSelect>

          <LunaSearchableSelect
            label="Creator"
            placeholder="Select creator..."
            options={creatorOptions}
            value={formData.creator_id || ''}
            onValueChange={(value) => setFormData({ ...formData, creator_id: value || null })}
          />
        </div>
      </div>

      {/* Media - side by side */}
      <div className="grid grid-cols-2 gap-4">
        <LunaFileUpload
          label="Cover Image"
          accept="image/*"
          maxSize={5 * 1024 * 1024} // 5MB
          helperText="Upload cover image (max 5MB)"
          onFilesChange={(files) => setFormData({ ...formData, coverImageFile: files[0] || null })}
        />

        <LunaFileUpload
          label="Intro Video"
          accept="video/*"
          maxSize={50 * 1024 * 1024} // 50MB
          helperText="Upload intro video (max 50MB)"
          onFilesChange={(files) => setFormData({ ...formData, introVideoFile: files[0] || null })}
        />
      </div>

      {/* Learning Outcomes & Skills */}
      <div className="space-y-4">
        <LunaMultiTextInput
          label="Learning Outcomes"
          placeholder="Add learning outcome..."
          helperText="Add specific outcomes students will achieve"
          value={formData.outcomes}
          onChange={(values) => setFormData({ ...formData, outcomes: values })}
          addButtonLabel="Add Outcome"
        />

        <LunaCombobox
          label="Skills Covered"
          placeholder="Select skills..."
          options={skillOptions}
          value={formData.skills}
          onChange={(values) => setFormData({ ...formData, skills: values })}
          helperText="Select all skills covered in this module"
        />

        <LunaMultiTextInput
          label="Requirements"
          placeholder="Add requirement..."
          helperText="Add prerequisites or requirements for this module"
          value={formData.requirements}
          onChange={(values) => setFormData({ ...formData, requirements: values })}
          addButtonLabel="Add Requirement"
        />
      </div>

      {/* Lessons - with background color */}
      <div className="space-y-4 bg-luna-gray-50 p-4 rounded-lg border border-luna-border-light">
        <h3 className="font-semibold text-base">Manage Lessons</h3>

        <LunaLessonSelector
          availableLessons={lessons}
          selectedLessons={formData.lessons}
          onChange={(selectedLessons) => setFormData({ ...formData, lessons: selectedLessons })}
        />
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Pricing</h3>

        <div className="flex items-center gap-4">
          <LunaSwitch
            label="Free Module"
            checked={formData.is_free}
            onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
          />
        </div>

        {!formData.is_free && (
          <LunaInput
            label="Price (Dollars)"
            type="number"
            min="0"
            step="0.01"
            value={formData.price.toString()}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            helperText={`${(formData.price * 100).toFixed(0)} credits`}
          />
        )}

        <div className="flex items-center gap-4">
          <LunaSwitch
            label="Scholarship Eligible"
            checked={formData.scholarship_eligible}
            onCheckedChange={(checked) => setFormData({ ...formData, scholarship_eligible: checked })}
          />
        </div>
      </div>

      {/* Publishing */}
      <div className="flex items-center gap-4">
        <LunaSwitch
          label="Publish Module"
          checked={formData.is_published}
          onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
        />
      </div>
    </form>
  );
}

