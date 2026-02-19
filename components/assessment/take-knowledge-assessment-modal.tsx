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
import { BookOpen, X } from 'lucide-react';
import { KnowledgeTest } from './knowledge-test';
import type { Database } from '@/types/database.types';

type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];

interface TakeKnowledgeAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  assessment: KnowledgeAssessment | null;
  onComplete: (attemptData: any) => void;
}

interface PreparedAssessment {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    time_limit_minutes: number;
    allow_review: boolean;
    passing_threshold: number;
  };
  questions: any[];
}

export function TakeKnowledgeAssessmentModal({
  open,
  onClose,
  assessment,
  onComplete,
}: TakeKnowledgeAssessmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preparedAssessment, setPreparedAssessment] = useState<PreparedAssessment | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (open && assessment) {
      prepareAssessment();
    } else {
      // Reset state when modal closes
      setPreparedAssessment(null);
      setError(null);
      setShowExitConfirm(false);
    }
  }, [open, assessment]);

  const prepareAssessment = async () => {
    if (!assessment) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/screening/knowledge/attempts/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessment_id: assessment.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to prepare assessment');
      }

      const data = await response.json();
      setPreparedAssessment(data);
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

  const handleTestComplete = (attemptData: any) => {
    onComplete(attemptData);
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-4xl h-[90vh]">
        {showExitConfirm ? (
          <>
            <LunaDialogHeader>
              <LunaDialogTitle>Exit Assessment?</LunaDialogTitle>
              <LunaDialogDescription>
                Are you sure you want to exit? Your progress will not be saved.
              </LunaDialogDescription>
            </LunaDialogHeader>
            <LunaDialogBody>
              <div className="flex justify-end gap-3">
                <LunaButton variant="outline" onClick={cancelExit}>
                  Continue Assessment
                </LunaButton>
                <LunaButton variant="danger" onClick={confirmExit}>
                  Exit
                </LunaButton>
              </div>
            </LunaDialogBody>
          </>
        ) : (
          <>
            <LunaDialogHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-luna-blue/10">
                  <BookOpen className="h-6 w-6 text-luna-blue" />
                </div>
                <div>
                  <LunaDialogTitle>{assessment?.title || 'Knowledge Assessment'}</LunaDialogTitle>
                  {assessment?.description && (
                    <LunaDialogDescription>{assessment.description}</LunaDialogDescription>
                  )}
                </div>
              </div>
            </LunaDialogHeader>

            <LunaDialogBody className="p-0 flex-1 overflow-hidden">
              {loading && (
                <div className="p-6 space-y-4">
                  <LunaSkeleton className="h-8 w-3/4" />
                  <LunaSkeleton className="h-32 w-full" />
                  <LunaSkeleton className="h-12 w-full" />
                  <LunaSkeleton className="h-12 w-full" />
                </div>
              )}

              {error && (
                <div className="p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {preparedAssessment && !loading && !error && (
                <KnowledgeTest
                  assessmentId={preparedAssessment.assessment.id}
                  questions={preparedAssessment.questions}
                  timeLimit={preparedAssessment.assessment.time_limit_minutes}
                  allowReview={preparedAssessment.assessment.allow_review}
                  passingThreshold={preparedAssessment.assessment.passing_threshold}
                  onComplete={handleTestComplete}
                  onCancel={handleExit}
                />
              )}
            </LunaDialogBody>
          </>
        )}
      </LunaDialogContent>
    </LunaDialog>
  );
}

