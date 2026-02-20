/**
 * Edit Module Modal
 * Modal for editing existing modules
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Loader2, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ModuleFormWizard, type ModuleFormData, type ModuleFormWizardRef } from '../forms/module-form-wizard';
import type { ContentItem } from '@/components/luna/learning/module-content-selector';
import type { Database } from '@/types/database.types';

type Module = Database['public']['Tables']['modules']['Row'];
type ModuleUpdate = Database['public']['Tables']['modules']['Update'];

interface EditModuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  onSuccess?: () => void;
}

export function EditModuleModal({
  open,
  onOpenChange,
  moduleId,
  onSuccess,
}: EditModuleModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [module, setModule] = useState<Module | null>(null);
  const [initialContent, setInitialContent] = useState<ContentItem[]>([]);
  const [initialScholarships, setInitialScholarships] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepValid, setIsStepValid] = useState(false);
  const wizardRef = useRef<ModuleFormWizardRef>(null);
  
  // Fetch module data when modal opens
  useEffect(() => {
    if (open && moduleId) {
      setCurrentStep(0); // Reset to first step when opening
      fetchModuleData();
    }
  }, [open, moduleId]);
  
  const fetchModuleData = async () => {
    try {
      const supabase = createClient();

      // Fetch module with creator relationship
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select('*, creators(id, name, logo_url)')
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;
      setModule(moduleData);
      
      // Fetch module lessons
      const { data: moduleLessons, error: lessonsError } = await supabase
        .from('module_lessons')
        .select('*, lessons(id, title, duration_minutes)')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Fetch module quizzes
      const { data: moduleQuizzes, error: quizzesError } = await supabase
        .from('module_quizzes')
        .select('*, quizzes(id, name, duration_minutes, number_of_questions)')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (quizzesError) throw quizzesError;

      // Combine lessons and quizzes into a single content array
      const content: ContentItem[] = [];

      // Add lessons
      (moduleLessons || [])
        .filter((ml: any) => ml.lessons && ml.lessons.id)
        .forEach((ml: any) => {
          content.push({
            id: ml.lessons.id,
            type: 'lesson',
            title: ml.lessons.title || 'Unknown Lesson',
            duration_minutes: ml.lessons.duration_minutes,
            sort_order: ml.sort_order,
            is_required: ml.is_required,
          });
        });

      // Add quizzes
      (moduleQuizzes || [])
        .filter((mq: any) => mq.quizzes && mq.quizzes.id)
        .forEach((mq: any) => {
          content.push({
            id: mq.quizzes.id,
            type: 'quiz',
            name: mq.quizzes.name || 'Unknown Quiz',
            duration_minutes: mq.quizzes.duration_minutes,
            number_of_questions: mq.quizzes.number_of_questions,
            sort_order: mq.sort_order,
            is_required: mq.is_required,
          });
        });

      // Sort by sort_order
      content.sort((a, b) => a.sort_order - b.sort_order);

      setInitialContent(content);

      // Fetch scholarship_content relationships
      const { data: scholarshipContent, error: scholarshipError } = await supabase
        .from('scholarship_content')
        .select('scholarship_id')
        .eq('content_type', 'module')
        .eq('content_id', moduleId);

      if (!scholarshipError && scholarshipContent) {
        const scholarshipIds = scholarshipContent.map((sc: any) => sc.scholarship_id);
        setInitialScholarships(scholarshipIds);
      }
    } catch (err) {
      console.error('Error fetching module:', err);
      setError('Failed to load module data');
    }
  };
  
  const handleSubmit = async (formData: ModuleFormData) => {
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
      
      // Upload new files if provided
      let coverImageUrl: string | null = module?.cover_image_url || null;
      let introVideoUrl: string | null = module?.intro_video_url || null;
      
      if (formData.coverImageFile) {
        const fileName = `${Date.now()}-${formData.coverImageFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('course-covers')
          .upload(fileName, formData.coverImageFile);
        
        if (uploadError) {
          setError(`Failed to upload cover image: ${uploadError.message}`);
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('course-covers')
          .getPublicUrl(uploadData.path);
        
        coverImageUrl = publicUrl;
      }
      
      if (formData.introVideoFile) {
        const fileName = `${Date.now()}-${formData.introVideoFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('intro-videos')
          .upload(fileName, formData.introVideoFile);
        
        if (uploadError) {
          setError(`Failed to upload intro video: ${uploadError.message}`);
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('intro-videos')
          .getPublicUrl(uploadData.path);
        
        introVideoUrl = publicUrl;
      }
      
      // Prepare module update data
      const moduleData: ModuleUpdate = {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        price: formData.price, // Changed from price_credits to price (dollars)
        is_free: formData.is_free,
        scholarship_eligible: formData.scholarship_eligible,
        is_published: formData.is_published,
        creator_id: formData.creator_id,
        cover_image_url: coverImageUrl,
        intro_video_url: introVideoUrl,
        learning_outcomes: formData.outcomes as any, // JSONB array
        requirements: formData.requirements.length > 0 ? formData.requirements.join('\n') : null, // TEXT field - join with newlines
        skills: formData.skills as any, // JSONB array
      };

      // Update module
      const response = await fetch(`/api/learning/modules/${moduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(moduleData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update module';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorResult.details || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const result = await response.json();

      // Split content into lessons and quizzes
      const lessons = formData.content.filter(item => item.type === 'lesson');
      const quizzes = formData.content.filter(item => item.type === 'quiz');

      // Update module_lessons relationships
      try {
        // Delete existing lessons
        const { error: deleteError } = await supabase
          .from('module_lessons')
          .delete()
          .eq('module_id', moduleId);

        if (deleteError) {
          console.error('Error deleting old module lessons:', deleteError);
          setError(`Module updated but failed to update lessons: ${deleteError.message}`);
          setLoading(false);
          return;
        }

        // Insert new lessons
        if (lessons.length > 0) {
          const moduleLessons = lessons.map((lesson) => ({
            module_id: moduleId,
            lesson_id: lesson.id,
            sort_order: lesson.sort_order,
            is_required: lesson.is_required,
          }));

          const { error: insertError } = await supabase
            .from('module_lessons')
            .insert(moduleLessons);

          if (insertError) {
            console.error('Error inserting new module lessons:', insertError);
            setError(`Module updated but failed to add lessons: ${insertError.message}`);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Exception updating module lessons:', err);
        setError(`Module updated but failed to update lessons: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Update module_quizzes relationships
      try {
        // Delete existing quizzes
        const { error: deleteQuizzesError } = await supabase
          .from('module_quizzes')
          .delete()
          .eq('module_id', moduleId);

        if (deleteQuizzesError) {
          console.error('Error deleting old module quizzes:', deleteQuizzesError);
          setError(`Module updated but failed to update quizzes: ${deleteQuizzesError.message}`);
          setLoading(false);
          return;
        }

        // Insert new quizzes
        if (quizzes.length > 0) {
          const moduleQuizzes = quizzes.map((quiz) => ({
            module_id: moduleId,
            quiz_id: quiz.id,
            sort_order: quiz.sort_order,
            is_required: quiz.is_required,
          }));

          const { error: insertQuizzesError } = await supabase
            .from('module_quizzes')
            .insert(moduleQuizzes);

          if (insertQuizzesError) {
            console.error('Error inserting new module quizzes:', insertQuizzesError);
            setError(`Module updated but failed to add quizzes: ${insertQuizzesError.message}`);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Exception updating module quizzes:', err);
        setError(`Module updated but failed to update quizzes: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }

      // Update scholarship_content relationships
      // Delete existing scholarship relationships
      const { error: deleteScholarshipError } = await supabase
        .from('scholarship_content')
        .delete()
        .eq('content_type', 'module')
        .eq('content_id', moduleId);

      if (deleteScholarshipError) {
        console.error('Error deleting old scholarship content:', deleteScholarshipError);
        // Don't fail the whole operation, just log the error
      }

      // Insert new scholarship relationships
      if (formData.scholarships && formData.scholarships.length > 0) {
        const scholarshipContent = formData.scholarships.map((scholarshipId) => ({
          scholarship_id: scholarshipId,
          content_type: 'module',
          content_id: moduleId,
        }));

        const { error: insertScholarshipError } = await supabase
          .from('scholarship_content')
          .insert(scholarshipContent);

        if (insertScholarshipError) {
          console.error('Error inserting new scholarship content:', insertScholarshipError);
          // Don't fail the whole operation, just log the error
        }
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error updating module:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setCurrentStep(0); // Reset wizard to first step
    onOpenChange(false);
  };

  if (!module) {
    return null;
  }

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-luna-blue" />
            Edit Module
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update module details, lessons, and content
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Scrollable Body */}
        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ModuleFormWizard
            ref={wizardRef}
            initialData={module}
            initialContent={initialContent}
            initialScholarships={initialScholarships}
            onSubmit={handleSubmit}
            loading={loading}
            onStepChange={setCurrentStep}
            onValidationChange={setIsStepValid}
          />
        </LunaDialogBody>

        {/* Sticky Footer */}
        <LunaDialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <LunaButton
              type="button"
              variant="outline"
              onClick={() => wizardRef.current?.handlePrevious()}
              disabled={currentStep === 0 || loading}
              icon={<ChevronLeft className="h-4 w-4" />}
            >
              Previous
            </LunaButton>
          </div>

          <div className="text-sm text-luna-gray-600">
            Step {currentStep + 1} of {wizardRef.current?.totalSteps || 6}
          </div>

          <div className="flex gap-2">
            {currentStep < (wizardRef.current?.totalSteps || 6) - 1 ? (
              <LunaButton
                type="button"
                variant="primary"
                onClick={() => wizardRef.current?.handleNext()}
                disabled={!isStepValid || loading}
              >
                Next
              </LunaButton>
            ) : (
              <LunaButton
                type="button"
                variant="primary"
                onClick={() => wizardRef.current?.handleSubmit()}
                disabled={!isStepValid || loading}
                loading={loading}
              >
                Update Module
              </LunaButton>
            )}
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

