/**
 * Edit Course Modal
 * Modal for editing existing courses
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
import { CourseFormWizard, type CourseFormData, type CourseFormWizardRef } from '../forms/course-form-wizard';
import type { SelectedModule } from '@/components/luna/learning/module-selector';
import type { Database } from '@/types/database.types';

type Course = Database['public']['Tables']['courses']['Row'];
type CourseUpdate = Database['public']['Tables']['courses']['Update'];

interface EditCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string | null;
  onSuccess?: () => void;
}

export function EditCourseModal({
  open,
  onOpenChange,
  courseId,
  onSuccess,
}: EditCourseModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [initialModules, setInitialModules] = useState<SelectedModule[]>([]);
  const [initialScholarships, setInitialScholarships] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepValid, setIsStepValid] = useState(false);
  const wizardRef = useRef<CourseFormWizardRef>(null);
  
  // Fetch course data when modal opens
  useEffect(() => {
    if (open && courseId) {
      setCurrentStep(0); // Reset to first step when opening
      fetchCourseData();
    }
  }, [open, courseId]);
  
  const fetchCourseData = async () => {
    if (!courseId) return;

    try {
      const supabase = createClient();

      // Fetch course with creator relationship
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*, creators(id, name, logo_url)')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch course modules
      const { data: courseModules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*, modules(id, title, duration_minutes)')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Filter out any modules that don't have valid module data
      const modules: SelectedModule[] = (courseModules || [])
        .filter((cm: any) => cm.modules && cm.modules.id)
        .map((cm: any) => ({
          id: cm.modules.id,
          title: cm.modules.title || 'Unknown Module',
          duration_minutes: cm.modules.duration_minutes,
          sort_order: cm.sort_order,
          is_required: cm.is_required,
        }));

      setInitialModules(modules);

      // Fetch scholarship_content relationships
      const { data: scholarshipContent, error: scholarshipError } = await supabase
        .from('scholarship_content')
        .select('scholarship_id')
        .eq('content_type', 'course')
        .eq('content_id', courseId);

      if (!scholarshipError && scholarshipContent) {
        const scholarshipIds = scholarshipContent.map((sc: any) => sc.scholarship_id);
        setInitialScholarships(scholarshipIds);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError('Failed to load course data');
    }
  };
  
  const handleSubmit = async (formData: CourseFormData) => {
    if (!courseId) {
      setError('Course ID is missing');
      return;
    }

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
      let coverImageUrl: string | null = course?.cover_image_url || null;
      let introVideoUrl: string | null = course?.intro_video_url || null;
      
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
      
      // Prepare course update data
      const courseData: CourseUpdate = {
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

      // Update Course
      const response = await fetch(`/api/learning/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to Update Course');
        setLoading(false);
        return;
      }

      // Update course_modules relationships
      // Delete existing modules
      const { error: deleteError } = await supabase
        .from('course_modules')
        .delete()
        .eq('course_id', courseId);

      if (deleteError) {
        console.error('Error deleting old course modules:', deleteError);
        setError('Course updated but failed to update modules');
        setLoading(false);
        return;
      }

      // Insert new modules
      if (formData.modules.length > 0) {
        const courseModules = formData.modules.map((module) => ({
          course_id: courseId,
          module_id: module.id,
          sort_order: module.sort_order,
          is_required: module.is_required,
        }));

        const { error: insertError } = await supabase
          .from('course_modules')
          .insert(courseModules);

        if (insertError) {
          console.error('Error inserting new course modules:', insertError);
          setError('Course updated but failed to add modules');
          setLoading(false);
          return;
        }
      }

      // Update scholarship_content relationships
      // Delete existing scholarship relationships
      const { error: deleteScholarshipError } = await supabase
        .from('scholarship_content')
        .delete()
        .eq('content_type', 'course')
        .eq('content_id', courseId);

      if (deleteScholarshipError) {
        console.error('Error deleting old scholarship content:', deleteScholarshipError);
        // Don't fail the whole operation, just log the error
      }

      // Insert new scholarship relationships
      if (formData.scholarships && formData.scholarships.length > 0) {
        const scholarshipContent = formData.scholarships.map((scholarshipId) => ({
          scholarship_id: scholarshipId,
          content_type: 'course',
          content_id: courseId,
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
      console.error('Error updating course:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setCurrentStep(0); // Reset wizard to first step
    onOpenChange(false);
  };

  if (!course) {
    return null;
  }

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-luna-blue" />
            Edit Course
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update Course details, modules, and content
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Scrollable Body */}
        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <CourseFormWizard
            ref={wizardRef}
            initialData={course}
            initialModules={initialModules}
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
                Update Course
              </LunaButton>
            )}
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

