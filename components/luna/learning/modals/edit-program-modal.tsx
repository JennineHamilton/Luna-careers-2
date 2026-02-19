/**
 * Edit Program Modal
 * Modal for editing existing programs
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
import { Briefcase, Loader2, ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ProgramFormWizard, type ProgramFormData, type ProgramFormWizardRef } from '../forms/program-form-wizard';
import type { SelectedCourse } from '@/components/luna/learning/course-selector';
import type { Database } from '@/types/database.types';

type Program = Database['public']['Tables']['programs']['Row'];
type ProgramUpdate = Database['public']['Tables']['programs']['Update'];

interface EditProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
  onSuccess?: () => void;
}

export function EditProgramModal({
  open,
  onOpenChange,
  programId,
  onSuccess,
}: EditProgramModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [program, setProgram] = useState<Program | null>(null);
  const [initialCourses, setInitialCourses] = useState<SelectedCourse[]>([]);
  const [initialScholarships, setInitialScholarships] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStepValid, setIsStepValid] = useState(false);
  const wizardRef = useRef<ProgramFormWizardRef>(null);

  // Fetch program data when modal opens
  useEffect(() => {
    if (open && programId) {
      setCurrentStep(0); // Reset to first step when opening
      fetchProgramData();
    }
  }, [open, programId]);

  const fetchProgramData = async () => {
    if (!programId) return;

    try {
      const supabase = createClient();

      // Fetch program with creator relationship
      const { data: programData, error: programError } = await supabase
        .from('programs')
        .select('*, creators(id, name, logo_url)')
        .eq('id', programId)
        .single();

      if (programError) throw programError;
      setProgram(programData);

      // Fetch program courses
      const { data: programCourses, error: coursesError } = await supabase
        .from('program_courses')
        .select('*, courses(id, title, duration_minutes)')
        .eq('program_id', programId)
        .order('sort_order', { ascending: true });

      if (coursesError) throw coursesError;

      // Filter out any courses that don't have valid course data
      const courses: SelectedCourse[] = (programCourses || [])
        .filter((pc: any) => pc.courses && pc.courses.id)
        .map((pc: any) => ({
          id: pc.courses.id,
          title: pc.courses.title || 'Unknown course',
          duration_minutes: pc.courses.duration_minutes,
          sort_order: pc.sort_order,
          is_required: pc.is_required,
        }));

      setInitialCourses(courses);

      // Fetch scholarship_content relationships
      const { data: scholarshipContent, error: scholarshipError } = await supabase
        .from('scholarship_content')
        .select('scholarship_id')
        .eq('content_type', 'program')
        .eq('content_id', programId);

      if (!scholarshipError && scholarshipContent) {
        const scholarshipIds = scholarshipContent.map((sc: any) => sc.scholarship_id);
        setInitialScholarships(scholarshipIds);
      }
    } catch (err) {
      console.error('Error fetching program:', err);
      setError('Failed to load program data');
    }
  };
  
  const handleSubmit = async (formData: ProgramFormData) => {
    if (!programId) {
      setError('Program ID is missing');
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
      let coverImageUrl: string | null = program?.cover_image_url || null;
      let introVideoUrl: string | null = program?.intro_video_url || null;
      
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
      const programData: ProgramUpdate = {
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
      const response = await fetch(`/api/learning/programs/${programId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(programData),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to update program');
        setLoading(false);
        return;
      }

      // Update program_courses relationships
      // Delete existing courses
      const { error: deleteError } = await supabase
        .from('program_courses')
        .delete()
        .eq('program_id', programId);

      if (deleteError) {
        console.error('Error deleting old program courses:', deleteError);
        setError('Program updated but failed to update courses');
        setLoading(false);
        return;
      }

      // Insert new courses
      if (formData.courses.length > 0) {
        const programCourses = formData.courses.map((course) => ({
          program_id: programId,
          course_id: course.id,
          sort_order: course.sort_order,
          is_required: course.is_required,
        }));

        const { error: insertError } = await supabase
          .from('program_courses')
          .insert(programCourses);

        if (insertError) {
          console.error('Error inserting new program courses:', insertError);
          setError('Program updated but failed to add courses');
          setLoading(false);
          return;
        }
      }

      // Update scholarship_content relationships
      // Delete existing scholarship relationships
      const { error: deleteScholarshipError } = await supabase
        .from('scholarship_content')
        .delete()
        .eq('content_type', 'program')
        .eq('content_id', programId);

      if (deleteScholarshipError) {
        console.error('Error deleting old scholarship content:', deleteScholarshipError);
        // Don't fail the whole operation, just log the error
      }

      // Insert new scholarship relationships
      if (formData.scholarships && formData.scholarships.length > 0) {
        const scholarshipContent = formData.scholarships.map((scholarshipId) => ({
          scholarship_id: scholarshipId,
          content_type: 'program',
          content_id: programId,
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
      console.error('Error updating program:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setCurrentStep(0); // Reset wizard to first step
    onOpenChange(false);
  };

  if (!program) {
    return null;
  }

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl">
        {/* Sticky Header */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-luna-blue" />
            Edit Program
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update program details, courses, and content
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
            initialData={program}
            initialCourses={initialCourses}
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


