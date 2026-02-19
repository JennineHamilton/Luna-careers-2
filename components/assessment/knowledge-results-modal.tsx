'use client';

import { useState } from 'react';
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
import { Trophy, CheckCircle, XCircle, Target, Clock, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeResultsModalProps {
  open: boolean;
  onClose: () => void;
  attemptData: any;
  onRetake?: () => void;
}

export function KnowledgeResultsModal({
  open,
  onClose,
  attemptData,
  onRetake,
}: KnowledgeResultsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(attemptData?.display_on_profile || false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!attemptData) return null;

  const {
    correct_answers = 0,
    total_questions = 0,
    score_percentage = 0,
    passed = false,
    time_in_milliseconds = 0,
    assessment_title = 'Knowledge Assessment',
  } = attemptData;

  const timeInSeconds = Math.round(time_in_milliseconds / 1000);
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;

  const handleAddToProfile = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/screening/knowledge/attempts/submit-to-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptData.attempt_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to profile');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error adding to profile:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to add to profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-2xl">
        <LunaDialogHeader>
          <div className="flex items-center gap-2">
            <Trophy className={cn(
              "h-6 w-6",
              passed ? "text-green-600" : "text-orange-600"
            )} />
            <LunaDialogTitle>
              {passed ? 'Assessment Passed!' : 'Assessment Complete'}
            </LunaDialogTitle>
          </div>
          <LunaDialogDescription>
            {passed 
              ? "Congratulations! You've successfully passed this assessment." 
              : "You've completed the assessment. Review your results below."}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-6">
          {/* Score Display */}
          <div className={cn(
            "rounded-lg p-6 text-center border-2",
            passed 
              ? "bg-green-50 border-green-200" 
              : "bg-orange-50 border-orange-200"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {passed ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : (
                <XCircle className="h-8 w-8 text-orange-600" />
              )}
            </div>
            <p className="text-5xl font-bold text-luna-gray-900 mb-2">
              {score_percentage}%
            </p>
            <p className="text-lg text-luna-gray-700">
              {correct_answers} out of {total_questions} correct
            </p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-luna-blue/5 border border-luna-blue/20 rounded-lg p-4 text-center">
              <Target className="h-6 w-6 text-luna-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-luna-gray-900">{correct_answers}/{total_questions}</p>
              <p className="text-sm text-luna-gray-600">Correct Answers</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-luna-gray-900">{minutes}:{seconds.toString().padStart(2, '0')}</p>
              <p className="text-sm text-luna-gray-600">Time Taken</p>
            </div>
          </div>

          {/* Submission Status */}
          {isSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Added to Profile</p>
                <p className="text-sm text-green-700">This assessment result is now visible on your profile</p>
              </div>
            </div>
          )}

          {/* Submission Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900">Failed to Add to Profile</p>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          )}
        </LunaDialogBody>

        <LunaDialogFooter>
          <LunaButton variant="secondary" onClick={onClose}>
            Close
          </LunaButton>
          {onRetake && !isSubmitted && (
            <LunaButton variant="outline" onClick={onRetake}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Assessment
            </LunaButton>
          )}
          {!isSubmitted && (
            <LunaButton onClick={handleAddToProfile} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to Profile...
                </>
              ) : (
                'Add to Profile'
              )}
            </LunaButton>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

