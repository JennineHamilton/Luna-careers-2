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
} from '@/components/luna/dialog';
import { LunaButton } from '@/components/luna/button';
import { LunaBadge } from '@/components/luna/badge';
import { Trophy, Zap, Target, Clock, TrendingUp, Loader2, CheckCircle } from 'lucide-react';
import { getBadgeByLevel } from '@/lib/utils/badge-calculator';

interface ResultsModalProps {
  open: boolean;
  onClose: () => void;
  attemptData: any;
  onRetake: () => void;
}

export function ResultsModal({
  open,
  onClose,
  attemptData,
  onRetake,
}: ResultsModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(attemptData?.attempt?.is_submitted || false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!attemptData) return null;

  const { attempt, metrics, badge, performance_report, is_new_best } = attemptData;

  const badgeInfo = getBadgeByLevel(badge?.levelNumeric || 1);

  const handleSubmitToProfile = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/screening/badges/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attempt.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit badge');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting badge:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit badge');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeVariant = (level: number): 'default' | 'primary' | 'success' | 'warning' | 'yellow' => {
    if (level >= 5) return 'yellow';  // Master - Gold
    if (level >= 4) return 'primary'; // Expert - Purple
    if (level >= 3) return 'success'; // Advanced - Green
    if (level >= 2) return 'primary'; // Intermediate - Blue
    return 'default';                 // Beginner - Gray
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-3xl">
        <LunaDialogHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-luna-blue" />
            <LunaDialogTitle>Assessment Complete!</LunaDialogTitle>
          </div>
          <LunaDialogDescription>
            {is_new_best 
              ? "Congratulations! This is your best score for this assessment!" 
              : "Great job completing the assessment!"}
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-luna-blue/5 border border-luna-blue/20 rounded-lg p-4 text-center">
              <Zap className="h-6 w-6 text-luna-blue mx-auto mb-2" />
              <p className="text-3xl font-bold text-luna-gray-900">{metrics?.wpm || 0}</p>
              <p className="text-sm text-luna-gray-600">WPM</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-luna-gray-900">{metrics?.accuracy?.toFixed(1) || 0}%</p>
              <p className="text-sm text-luna-gray-600">Accuracy</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <p className="text-3xl font-bold text-luna-gray-900">{metrics?.timeInSeconds || 0}s</p>
              <p className="text-sm text-luna-gray-600">Duration</p>
            </div>
          </div>

          {/* Badge Level */}
          <div className="bg-gradient-to-r from-luna-blue/10 to-purple-100 border border-luna-blue/30 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-luna-gray-600 mb-2">Skill Level Achieved</p>
                <div className="flex items-center gap-3">
                  <LunaBadge variant={getBadgeVariant(badgeInfo.levelNumeric)} className="text-lg px-4 py-2">
                    {badgeInfo.name}
                  </LunaBadge>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-3 h-3 rounded-full ${
                          level <= badgeInfo.levelNumeric
                            ? 'bg-luna-blue'
                            : 'bg-luna-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-luna-gray-600 mt-2">{badgeInfo.description}</p>
              </div>
              <Trophy className="h-12 w-12 text-luna-blue" />
            </div>
          </div>

          {/* AI Performance Report */}
          {performance_report && (
            <div className="bg-white border border-luna-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-luna-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-luna-blue" />
                Performance Analysis
              </h3>
              <div className="prose prose-sm max-w-none text-luna-gray-700">
                <p className="whitespace-pre-wrap">{performance_report}</p>
              </div>
            </div>
          )}

          {/* Submission Status */}
          {isSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Badge Added to Profile</p>
                <p className="text-sm text-green-700">This skill is now visible to employers</p>
              </div>
            </div>
          )}

          {/* Submission Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-medium text-red-900">Failed to Submit Badge</p>
              <p className="text-sm text-red-700 mt-1">{submitError}</p>
            </div>
          )}
        </LunaDialogBody>

        <LunaDialogFooter className="flex items-center justify-between">
          <LunaButton variant="ghost" onClick={onClose}>
            Close
          </LunaButton>
          <div className="flex gap-3">
            <LunaButton variant="outline" onClick={onRetake}>
              Retake Assessment
            </LunaButton>
            {!isSubmitted && (
              <LunaButton
                variant="primary"
                onClick={handleSubmitToProfile}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Submit to Profile
                  </>
                )}
              </LunaButton>
            )}
          </div>
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}

