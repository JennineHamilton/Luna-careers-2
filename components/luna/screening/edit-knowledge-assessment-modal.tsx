'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDialogFooter,
  LunaButton,
  LunaStepper,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, AlertTriangle, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';
import { KnowledgeAssessmentForm, type KnowledgeFormData } from './knowledge-assessment-form';
import { KnowledgeQuestionBuilder, type KnowledgeQuestion } from './knowledge-question-builder';

type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];

interface EditKnowledgeAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  assessment: KnowledgeAssessment;
  onSuccess: () => void;
}

const STEPS = [
  { id: 'settings', label: 'Settings' },
  { id: 'questions', label: 'Questions' },
];

export function EditKnowledgeAssessmentModal({
  open,
  onClose,
  assessment,
  onSuccess,
}: EditKnowledgeAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');
  const [canProceed, setCanProceed] = useState(true);
  const [formData, setFormData] = useState<KnowledgeFormData | null>(null);
  const [questions, setQuestions] = useState<KnowledgeQuestion[]>([]);

  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const response = await fetch(`/api/screening/knowledge/${assessment.id}`);
      if (!response.ok) throw new Error('Failed to load questions');

      const data = await response.json();

      // Convert questions to the format expected by KnowledgeQuestionBuilder
      const loadedQuestions: KnowledgeQuestion[] = (data.questions || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        image_url: q.image_url,
        options: q.options || [],
      }));

      setQuestions(loadedQuestions);
    } catch (err: any) {
      console.error('Error loading questions:', err);
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [assessment.id]);

  // Load questions when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setError('');
      loadQuestions();
    }
  }, [open, loadQuestions]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setCurrentStep(0);
      setError('');
      setFormData(null);
      onClose();
    }
  }, [loading, onClose]);

  const handleFormDataChange = useCallback((data: KnowledgeFormData) => {
    setFormData(data);
  }, []);

  const handleValidationChange = useCallback((isValid: boolean) => {
    setCanProceed(isValid);
  }, []);

  const handleQuestionsChange = (updatedQuestions: KnowledgeQuestion[]) => {
    setQuestions(updatedQuestions);
  };

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = async () => {
    if (!formData) {
      setError('Please fill in all required fields');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Upload images for questions that have image files
      const questionsWithImages = await Promise.all(
        questions.map(async (q) => {
          if (q.image_file) {
            const fileExt = q.image_file.name.split('.').pop();
            const fileName = `knowledge/${assessment.id}/${q.id}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('assessment-images')
              .upload(fileName, q.image_file, { upsert: true });

            if (uploadError) {
              console.error('Error uploading image:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('assessment-images')
                .getPublicUrl(fileName);

              return { ...q, image_url: publicUrl, image_file: undefined };
            }
          }
          return { ...q, image_file: undefined };
        })
      );

      const response = await fetch(`/api/screening/knowledge/${assessment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category,
          questions_per_attempt: parseInt(formData.questions_per_attempt),
          passing_threshold: parseInt(formData.passing_threshold),
          time_limit_minutes: parseInt(formData.time_limit_minutes),
          allow_review: formData.allow_review,
          is_published: formData.is_published,
          questions: questionsWithImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assessment');
      }

      setLoading(false);
      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Error updating assessment:', err);
      setError(err.message || 'Failed to update assessment');
      setLoading(false);
    }
  };

  const initialFormData = useMemo<KnowledgeFormData>(() => ({
    title: assessment.title,
    description: assessment.description || '',
    category: assessment.category,
    questions_per_attempt: assessment.questions_per_attempt.toString(),
    passing_threshold: assessment.passing_threshold.toString(),
    time_limit_minutes: assessment.time_limit_minutes.toString(),
    allow_review: assessment.allow_review ?? true,
    is_published: assessment.is_published ?? false,
  }), [
    assessment.title,
    assessment.description,
    assessment.category,
    assessment.questions_per_attempt,
    assessment.passing_threshold,
    assessment.time_limit_minutes,
    assessment.allow_review,
    assessment.is_published,
  ]);

  return (
    <LunaDialog open={open} onOpenChange={handleClose}>
      <LunaDialogContent className="max-w-4xl max-h-[90vh]">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Edit Knowledge Assessment
          </LunaDialogTitle>
          <LunaDialogDescription>
            Update assessment settings and questions
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-4 overflow-y-auto">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stepper */}
          <LunaStepper steps={STEPS} currentStep={currentStep} />

          {/* Step 1: Settings */}
          {currentStep === 0 && (
            <KnowledgeAssessmentForm
              onValidationChange={handleValidationChange}
              onFormDataChange={handleFormDataChange}
              initialData={initialFormData}
            />
          )}

          {/* Step 2: Questions */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {loadingQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                  <span className="ml-2 text-luna-gray-600">Loading questions...</span>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-luna-gray-600 mb-2">
                      Edit questions for your knowledge assessment. The system will randomly select {formData?.questions_per_attempt || assessment.questions_per_attempt} questions from your question bank for each attempt.
                    </p>
                    <p className="text-xs text-luna-gray-500">
                      Make sure to have more questions than the number per attempt to ensure variety.
                    </p>
                  </div>

                  <KnowledgeQuestionBuilder
                    questions={questions}
                    onQuestionsChange={handleQuestionsChange}
                  />
                </>
              )}
            </div>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentStep > 0 && (
                <LunaButton
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading}
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Previous
                </LunaButton>
              )}
            </div>
            <div className="flex gap-2">
              <LunaButton variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </LunaButton>
              {currentStep < STEPS.length - 1 ? (
                <LunaButton
                  onClick={handleNext}
                  disabled={!canProceed || loading}
                  icon={<ArrowRight className="h-4 w-4" />}
                >
                  Next
                </LunaButton>
              ) : (
                <LunaButton
                  onClick={handleSubmit}
                  disabled={loading || questions.length === 0}
                  icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </LunaButton>
              )}
            </div>
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

