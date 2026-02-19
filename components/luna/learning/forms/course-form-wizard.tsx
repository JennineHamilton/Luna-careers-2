'use client';

/**
 * Course Form Wizard Component
 * Multi-step form for creating/editing courses
 * Step 1: Basic Info (Title, Description, Level, Creator, Pricing)
 * Step 2: Media (Cover Image, Intro Video)
 * Step 3: Learning Outcomes
 * Step 4: Skills
 * Step 5: Requirements
 * Step 6: Modules
 */

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  LunaInput,
  LunaTextarea,
  LunaButton,
  LunaSelect,
  LunaSelectItem,
  LunaSwitch,
  LunaMultiTextInput,
  LunaCombobox,
  LunaStepper,
} from '@/components/luna';
import { LunaFileUpload } from '@/components/luna/file-upload';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaModuleSelector, type SelectedModule } from '@/components/luna/learning/module-selector';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { dollarsToCredits, formatDollars, formatCredits } from '@/lib/utils/credit-conversion';

type Course = Database['public']['Tables']['courses']['Row'];
type Skill = Database['public']['Tables']['skills']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];
type Creator = Database['public']['Tables']['creators']['Row'];

export interface CourseFormData {
  title: string;
  description: string;
  level: string;
  price: number; // Changed from price_credits to price (dollars)
  is_free: boolean;
  scholarship_eligible: boolean;
  is_published: boolean;
  creator_id: string | null;
  coverImageFile?: File | null;
  introVideoFile?: File | null;
  outcomes: string[];
  requirements: string[];
  skills: string[];
  modules: SelectedModule[];
  scholarships: string[]; // scholarship IDs
}

export interface CourseFormWizardProps {
  initialData?: Course;
  initialModules?: SelectedModule[];
  initialScholarships?: string[];
  onSubmit: (data: CourseFormData) => Promise<void>;
  loading?: boolean;
  onStepChange?: (step: number) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface CourseFormWizardRef {
  currentStep: number;
  totalSteps: number;
  isStepValid: () => boolean;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: () => Promise<void>;
  formData: CourseFormData;
}

const STEPS = [
  { label: 'Basic Info' },
  { label: 'Media' },
  { label: 'Outcomes' },
  { label: 'Skills' },
  { label: 'Requirements' },
  { label: 'Modules' },
];

export const CourseFormWizard = forwardRef<CourseFormWizardRef, CourseFormWizardProps>(function CourseFormWizard({
  initialData,
  initialModules = [],
  initialScholarships = [],
  onSubmit,
  loading: externalLoading,
  onStepChange,
  onValidationChange,
}, ref) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const [skills, setSkills] = useState<Skill[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [creditsPerDollar, setCreditsPerDollar] = useState(100);

  const [formData, setFormData] = useState<CourseFormData>({
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
    requirements: Array.isArray(initialData?.requirements)
      ? (initialData.requirements as Array<string | { requirement_text: string }>).map(r => typeof r === 'string' ? r : r.requirement_text || '')
      : (initialData?.requirements ? String(initialData.requirements).split(/[\n,]/).map(r => r.trim()).filter(Boolean) : []),
    skills: Array.isArray(initialData?.skills)
      ? (initialData.skills as any[]).map((s: any) => typeof s === 'string' ? s : s.id || s)
      : [],
    modules: initialModules,
    scholarships: initialScholarships,
  });

  // Reset form data when initialData.id or initialModules length changes (indicates new module being edited)
  useEffect(() => {
    setFormData({
      title: initialData?.title || '',
      description: initialData?.description || '',
      level: initialData?.level || 'beginner',
      price: (initialData as any)?.price || ((initialData as any)?.price_credits ? (initialData as any).price_credits / 100 : 0),
      is_free: initialData?.is_free || false,
      scholarship_eligible: initialData?.scholarship_eligible || false,
      is_published: initialData?.is_published || false,
      creator_id: initialData?.creator_id || null,
      coverImageFile: null,
      introVideoFile: null,
      outcomes: Array.isArray(initialData?.learning_outcomes)
        ? (initialData.learning_outcomes as any[]).map((o: any) => typeof o === 'string' ? o : o.outcome_text || o)
        : [],
      requirements: Array.isArray(initialData?.requirements)
        ? (initialData.requirements as any[]).map((r: any) => typeof r === 'string' ? r : r.requirement_text || r)
        : (initialData?.requirements ? String(initialData.requirements).split(/[\n,]/).map(r => r.trim()).filter(Boolean) : []),
      skills: Array.isArray(initialData?.skills)
        ? (initialData.skills as any[]).map((s: any) => typeof s === 'string' ? s : s.id || s)
        : [],
      modules: initialModules,
      scholarships: initialScholarships,
    });
    // Only re-run when the course ID changes or modules/scholarships array length changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id, initialModules.length, initialScholarships.length]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch skills
        const skillsRes = await fetch('/api/learning/skills');
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setSkills(skillsData.skills || []);
        }

        // Fetch modules
        const modulesRes = await fetch('/api/learning/modules?published_only=false');
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setModules(modulesData.modules || []);
        }

        // Fetch creators
        const creatorsRes = await fetch('/api/learning/creators');
        if (creatorsRes.ok) {
          const creatorsData = await creatorsRes.json();
          setCreators(creatorsData.creators || []);
        }

        // Fetch scholarships
        const scholarshipsRes = await fetch('/api/learning/scholarships?active_only=false');
        if (scholarshipsRes.ok) {
          const scholarshipsData = await scholarshipsRes.json();
          setScholarships(scholarshipsData.scholarships || []);
        }

        // Fetch settings (optional - use default if fails)
        try {
          const settingsRes = await fetch('/api/settings/platform');
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json();
            if (settingsData.settings?.credits_per_dollar) {
              setCreditsPerDollar(settingsData.settings.credits_per_dollar);
            }
          }
        } catch (settingsError) {
          // Use default credits_per_dollar (100) if settings fetch fails
          console.log('Using default credits_per_dollar: 100');
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };

    fetchData();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.title.trim() !== '' && formData.description.trim() !== '';
      case 1: // Media (optional)
        return true;
      case 2: // Outcomes (optional but recommended)
        return true;
      case 3: // Skills (optional)
        return true;
      case 4: // Requirements (optional)
        return true;
      case 5: // Lessons (optional)
        return true;
      default:
        return true;
    }
  };

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    currentStep,
    totalSteps: STEPS.length,
    isStepValid,
    handleNext,
    handlePrevious,
    handleSubmit,
    formData,
  }));

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(isStepValid());
  }, [currentStep, formData.title, formData.description, onValidationChange]);

  const skillOptions = skills.map((skill) => ({
    value: skill.id,
    label: `${skill.name} (${skill.category})`,
  }));

  const creatorOptions = creators.map((creator) => ({
    value: creator.id,
    label: creator.name,
  }));

  const priceInCredits = dollarsToCredits(formData.price, creditsPerDollar);

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <LunaStepper steps={STEPS} currentStep={currentStep} />

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Basic Info */}
        {currentStep === 0 && (
          <div className="space-y-3">
            <LunaInput
              label="Course Title"
              placeholder="e.g., Introduction to React"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <LunaTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the course..."
              rows={3}
              required
            />

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-1">
                {!formData.is_free && (
                  <LunaInput
                    label="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price.toString()}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    helperText={`${formatCredits(priceInCredits)} credits`}
                  />
                )}
              </div>

              <div className="col-span-2 flex gap-4">
                <LunaSwitch
                  label="Free"
                  checked={formData.is_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                />
                <LunaSwitch
                  label="Scholarship Eligible"
                  checked={formData.scholarship_eligible}
                  onCheckedChange={(checked) => setFormData({ ...formData, scholarship_eligible: checked })}
                />
                <LunaSwitch
                  label="Published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
              </div>

              {/* Scholarship Selection - Only show when scholarship_eligible is true */}
              {formData.scholarship_eligible && (
                <div className="col-span-2">
                  <LunaCombobox
                    label="Available Scholarships"
                    placeholder={formData.scholarships.length > 0 ? `${formData.scholarships.length} scholarship(s) selected` : "Select scholarships..."}
                    options={scholarships.map(s => ({ value: s.id, label: s.name }))}
                    value={formData.scholarships}
                    onChange={(values) => setFormData({ ...formData, scholarships: values })}
                    helperText="Select which scholarships can be applied to this course"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Media */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <LunaFileUpload
                  label="Cover Image"
                  accept="image/*"
                  maxSize={5 * 1024 * 1024}
                  helperText="Max 5MB"
                  onFilesChange={(files) => setFormData({ ...formData, coverImageFile: files[0] || null })}
                />
                {initialData?.cover_image_url && !formData.coverImageFile && (
                  <div className="mt-2 p-2 bg-luna-gray-50 border border-luna-gray-200 rounded-lg">
                    <p className="text-xs text-luna-gray-600 mb-1">Current cover image:</p>
                    <img
                      src={initialData.cover_image_url}
                      alt="Current cover"
                      className="w-full h-32 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div>
                <LunaFileUpload
                  label="Intro Video"
                  accept="video/*"
                  maxSize={50 * 1024 * 1024}
                  helperText="Max 50MB"
                  onFilesChange={(files) => setFormData({ ...formData, introVideoFile: files[0] || null })}
                />
                {initialData?.intro_video_url && !formData.introVideoFile && (
                  <div className="mt-2 p-2 bg-luna-gray-50 border border-luna-gray-200 rounded-lg">
                    <p className="text-xs text-luna-gray-600 mb-1">Current intro video:</p>
                    <video
                      src={initialData.intro_video_url}
                      controls
                      className="w-full h-32 rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Learning Outcomes */}
        {currentStep === 2 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-luna-gray-900 mb-2">
                Learning Outcomes
              </label>
              <p className="text-xs text-luna-gray-600 mb-3">
                What will students learn from this course?
              </p>
            </div>
            <LunaMultiTextInput
              placeholder="Add learning outcome..."
              value={formData.outcomes}
              onChange={(values) => setFormData({ ...formData, outcomes: values })}
              addButtonLabel="Add Outcome"
            />
          </div>
        )}

        {/* Step 4: Skills */}
        {currentStep === 3 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-luna-gray-900 mb-2">
                Skills Covered
              </label>
              <p className="text-xs text-luna-gray-600 mb-3">
                Select the skills students will develop
              </p>
            </div>

            {/* Skills Selector - Using combobox with hidden badges */}
            <div className="relative [&_[data-slot='luna-badge']]:hidden">
              <LunaCombobox
                placeholder={formData.skills.length > 0 ? `${formData.skills.length} skill(s) selected` : "Select skills..."}
                options={skillOptions}
                value={formData.skills}
                onChange={(values) => setFormData({ ...formData, skills: values })}
              />
            </div>

            {/* Display selected skills as a clean list */}
            {formData.skills.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-luna-gray-700 mb-2">
                  Selected Skills ({formData.skills.length})
                </p>
                <ul className="space-y-2">
                  {formData.skills.map((skillId) => {
                    const skill = skills.find(s => s.id === skillId);
                    return skill ? (
                      <li
                        key={skillId}
                        className="flex items-center gap-2 p-2 bg-luna-gray-50 border border-luna-gray-200 rounded-lg group hover:border-luna-gray-300 transition-colors"
                      >
                        <span className="flex-1 text-sm text-luna-gray-900">
                          {skill.name} <span className="text-luna-gray-500">({skill.category})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newSkills = formData.skills.filter(id => id !== skillId);
                            setFormData({ ...formData, skills: newSkills });
                          }}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-luna-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Remove skill"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Requirements */}
        {currentStep === 4 && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-luna-gray-900 mb-2">
                Prerequisites & Requirements
              </label>
              <p className="text-xs text-luna-gray-600 mb-3">
                What should students know before taking this course?
              </p>
            </div>
            <LunaMultiTextInput
              placeholder="Add requirement..."
              value={formData.requirements}
              onChange={(values) => setFormData({ ...formData, requirements: values })}
              addButtonLabel="Add Requirement"
            />
          </div>
        )}

        {/* Step 6: Modules */}
        {currentStep === 5 && (
          <div className="space-y-3">
            <LunaModuleSelector
              availableModules={modules.map(m => ({ id: m.id, title: m.title, duration_minutes: m.duration_minutes ?? undefined }))}
              selectedModules={formData.modules}
              onChange={(selectedModules) => setFormData({ ...formData, modules: selectedModules })}
            />
          </div>
        )}
      </div>
    </div>
  );
});

