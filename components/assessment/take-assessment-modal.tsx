'use client';

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
} from '@/components/luna/dialog';
import { LunaButton } from '@/components/luna/button';
import { LunaSkeleton } from '@/components/luna/skeleton';
import { Keyboard, X, Brain } from 'lucide-react';
import { TypingTest } from './basic-typing-test';
import { PersonalityAssessmentModal } from './personality-assessment-modal';
import type { Database } from '@/types/database.types';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];

interface TakeAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  assessment: AssessmentTemplate | null;
  onComplete: (attemptData: any) => void;
}

interface PreparedAssessment {
  passage: string | null;
  audio_url: string | null;
  audio_mime_type?: string | null;
  duration_seconds: number;
  assessment_title: string;
  assessment_type: 'basic' | 'transcription' | 'soft_skills';
  has_audio: boolean;
  attempt_id?: string; // For personality assessments
}

export function TakeAssessmentModal({
  open,
  onClose,
  assessment,
  onComplete,
}: TakeAssessmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedAssessment, setPreparedAssessment] = useState<PreparedAssessment | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Prepare assessment content when modal opens (but don't create attempt yet)
  // Skip for soft_skills assessments - they have their own modal flow
  useEffect(() => {
    if (open && assessment && !preparedAssessment && assessment.assessment_type !== 'soft_skills') {
      prepareAssessment();
    }
  }, [open, assessment]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPreparedAssessment(null);
      setError(null);
      setShowExitConfirm(false);
    }
  }, [open]);

  const prepareAssessment = async () => {
    if (!assessment) return;

    setLoading(true);
    setError(null);

    try {
      // For soft_skills assessments, start a personality attempt
      if (assessment.assessment_type === 'soft_skills') {
        const response = await fetch('/api/personality/start', {
          method: 'POST',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to start personality assessment');
        }

        const data = await response.json();
        setPreparedAssessment({
          passage: null,
          audio_url: null,
          duration_seconds: assessment.duration_seconds || 900,
          assessment_title: assessment.title,
          assessment_type: 'soft_skills',
          has_audio: false,
          attempt_id: data.attempt_id,
        });
      } else {
        // For typing/transcription assessments, use the existing prepare endpoint
        const response = await fetch('/api/screening/attempts/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assessment_template_id: assessment.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to prepare assessment');
        }

        const data = await response.json();
        setPreparedAssessment(data);
      }
    } catch (err) {
      console.error('Error preparing assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to prepare assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = () => {
    setShowExitConfirm(false);
    onClose();
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  const handleTestComplete = (results: any) => {
    onComplete(results);
  };

  if (!assessment) return null;

  // For soft_skills assessments, use the PersonalityAssessmentModal
  if (assessment.assessment_type === 'soft_skills') {
    return (
      <PersonalityAssessmentModal
        open={open}
        onClose={onClose}
        onComplete={(attemptId) => {
          window.location.href = `/u/personality/results/${attemptId}`;
        }}
      />
    );
  }

  // For typing/transcription assessments, use the standard modal
  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-5xl max-h-[90vh] flex flex-col" showCloseButton={false}>
        {showExitConfirm ? (
          <>
            <LunaDialogHeader>
              <LunaDialogTitle>Exit Assessment?</LunaDialogTitle>
              <LunaDialogDescription>
                Your progress will not be saved. Are you sure you want to exit?
              </LunaDialogDescription>
            </LunaDialogHeader>
            <LunaDialogBody className="flex gap-3 justify-end">
              <LunaButton variant="outline" onClick={cancelExit}>
                Continue Test
              </LunaButton>
              <LunaButton variant="danger" onClick={confirmExit}>
                Exit Without Saving
              </LunaButton>
            </LunaDialogBody>
          </>
        ) : (
          <>
            <LunaDialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-luna-blue" />
                  <LunaDialogTitle>{assessment.title}</LunaDialogTitle>
                </div>
                <LunaButton variant="ghost" size="sm" onClick={handleExit}>
                  <X className="h-4 w-4" />
                </LunaButton>
              </div>
              <LunaDialogDescription>{assessment.description}</LunaDialogDescription>
            </LunaDialogHeader>

            {loading && (
              <LunaDialogBody className="p-6">
                <div className="space-y-4">
                  <div className="bg-luna-gray-50 border border-luna-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-6">
                      <LunaSkeleton variant="rectangular" width={100} height={40} />
                      <LunaSkeleton variant="rectangular" width={100} height={40} />
                      <LunaSkeleton variant="rectangular" width={100} height={40} />
                    </div>
                  </div>
                  <LunaSkeleton variant="rectangular" width="100%" height={200} />
                  <LunaSkeleton variant="rectangular" width="100%" height={60} />
                </div>
              </LunaDialogBody>
            )}

            {error && (
              <LunaDialogBody className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                </div>
              </LunaDialogBody>
            )}

            {preparedAssessment && !loading && !error && (
              <TypingTest
                assessmentTemplateId={assessment!.id}
                passage={preparedAssessment.passage || ''}
                durationSeconds={preparedAssessment.duration_seconds}
                hasAudio={preparedAssessment.has_audio}
                audioUrl={preparedAssessment.audio_url || undefined}
                audioMimeType={preparedAssessment.audio_mime_type || undefined}
                onComplete={handleTestComplete}
                onCancel={handleExit}
              />
            )}
          </>
        )}
      </LunaDialogContent>
    </LunaDialog>
  );
}

