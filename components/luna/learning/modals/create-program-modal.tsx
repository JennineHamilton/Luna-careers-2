/**
 * Create Program Modal
 * Modal for creating new programs
 */

'use client';

import { useState, useRef } from 'react';
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
import { Loader2, Briefcase, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProgramFormWizard, type ProgramFormData, type ProgramFormWizardRef } from '../forms/program-form-wizard';
import type { Database } from '@/types/database.types';

type ProgramInsert = Database['public']['Tables']['programs']['Insert'];

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateProgramModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateProgramModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepValid, setIsStepValid] = useState(false);
  const wizardRef = useRef<ProgramFormWizardRef>(null);
  
  const handleSubmit = async (formData: ProgramFormData) => {
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

      // Upload files to storage if provided
      let coverImageUrl: string | null = null;
      let introVideoUrl: string | null = null;

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

      // Prepare program data
      const programData: ProgramInsert = {
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

      // Create Course
      const response = await fetch('/api/learning/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(programData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to Create Program');
        setLoading(false);
        return;
      }

      // Create program_courses relationships
      if (formData.courses.length > 0 && result.program) {
        const programCourses = formData.courses.map((course) => ({
          program_id: result.program.id,
          course_id: course.id,
          sort_order: course.sort_order,
          is_required: course.is_required,
        }));

        const { error: coursesError } = await supabase
          .from('program_courses')
          .insert(programCourses);

        if (coursesError) {
          console.error('Error creating program courses:', coursesError);
          setError('Program created but failed to add courses');
          setLoading(false);
          return;
        }
      }

      // Create scholarship_content relationships
      if (formData.scholarships && formData.scholarships.length > 0 && result.program) {
        const scholarshipContent = formData.scholarships.map((scholarshipId) => ({
          scholarship_id: scholarshipId,
          content_type: 'program',
          content_id: result.program.id,
        }));

        const { error: scholarshipError } = await supabase
          .from('scholarship_content')
          .insert(scholarshipContent);

        if (scholarshipError) {
          console.error('Error creating scholarship content:', scholarshipError);
          // Don't fail the whole operation, just log the error
        }
      }

      // Success!
      setLoading(false);
      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Error creating program:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };
  
  const handleClose = () => {
    setError('');
    setCurrentStep(0); // Reset wizard to first step
    onOpenChange(false);
  };
  
  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-luna-blue" />
            Create New Course
          </LunaDialogTitle>
          <LunaDialogDescription>
            Create a new learning program with courses and content
          </LunaDialogDescription>
        </LunaDialogHeader>

        {/* Scrollable Body */}
        <LunaDialogBody className="text-sm max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <ProgramFormWizard
            ref={wizardRef}
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
                Create Course
              </LunaButton>
            )}
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}


