'use client';

/**
 * Cognitive Assessment Modal
 * ICAR-based cognitive ability assessment with jsPsych integration
 * Updated: Device check removed
 */

import { useState, useEffect, useRef } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaButton,
} from '@/components/luna';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { CognitiveQuestion, CognitiveResponse } from '@/lib/cognitive/types';

interface CognitiveAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (attemptId: string) => void;
}

type AssessmentStep = 'overview' | 'assessment' | 'completing';

export function CognitiveAssessmentModal({
  open,
  onClose,
  onComplete,
}: CognitiveAssessmentModalProps) {
  const [step, setStep] = useState<AssessmentStep>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<CognitiveQuestion[]>([]);
  const jsPsychContainerRef = useRef<HTMLDivElement>(null);
  const jsPsychInstanceRef = useRef<any>(null);

  // Debug logging
  useEffect(() => {
    console.log('🧠 CognitiveAssessmentModal render:', { open, step, loading, error });
  }, [open, step, loading, error]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('overview');
      setError('');
      setAttemptId(null);
      setQuestions([]);

      // Clean up jsPsych instance
      if (jsPsychInstanceRef.current) {
        try {
          jsPsychInstanceRef.current.endExperiment();
        } catch (e) {
          // Ignore cleanup errors
        }
        jsPsychInstanceRef.current = null;
      }
    }
  }, [open]);

  const handleStartAssessment = async () => {
    setLoading(true);
    setError('');

    try {
      // First, get the cognitive assessment template ID
      const templatesResponse = await fetch('/api/assessments/templates?category=cognitive');
      if (!templatesResponse.ok) {
        throw new Error('Failed to fetch cognitive template');
      }

      const templates = await templatesResponse.json();
      const cognitiveTemplate = templates.find((t: any) => t.category === 'cognitive');

      if (!cognitiveTemplate) {
        throw new Error('Cognitive assessment template not found');
      }

      // Start the assessment with the correct template ID
      const startResponse = await fetch('/api/cognitive/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: cognitiveTemplate.id
        }),
      });

      if (!startResponse.ok) {
        const errorData = await startResponse.json();
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const data = await startResponse.json();
      setAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setStep('assessment');

      // Initialize jsPsych after state update
      setTimeout(() => initializeJsPsych(data.questions, data.attempt_id), 100);
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  const initializeJsPsych = async (questionsList: CognitiveQuestion[], currentAttemptId: string) => {
    if (!jsPsychContainerRef.current) return;

    // Dynamically import jsPsych timeline builder (client-side only)
    const { createJsPsychInstance, buildCognitiveTimeline } = await import('@/lib/cognitive/jspsych-timeline');

    // Create response handler
    const handleResponse = async (response: CognitiveResponse) => {
      try {
        await fetch('/api/cognitive/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: currentAttemptId,
            ...response
          }),
        });
      } catch (err) {
        console.error('Error saving response:', err);
      }
    };

    // Create jsPsych instance
    const jsPsych = createJsPsychInstance(async () => {
      // On finish, complete the assessment
      setStep('completing');
      await completeAssessment(currentAttemptId);
    });

    // Build timeline
    const timeline = buildCognitiveTimeline(questionsList, handleResponse);

    // Store instance
    jsPsychInstanceRef.current = jsPsych;

    // Run experiment
    jsPsych.run(timeline);
  };

  const completeAssessment = async (currentAttemptId: string) => {
    try {
      const response = await fetch('/api/cognitive/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: currentAttemptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete assessment');
      }

      // Success - notify parent
      onComplete(currentAttemptId);
    } catch (err) {
      console.error('Error completing assessment:', err);
      setError('Failed to save results. Please contact support.');
    }
  };

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className={step === 'assessment' ? 'max-w-6xl h-[90vh]' : 'max-w-2xl'}>
        {step !== 'assessment' && (
          <LunaDialogHeader>
            <LunaDialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Cognitive Ability Assessment
            </LunaDialogTitle>
            <LunaDialogDescription>
              {step === 'overview' && 'ICAR-based cognitive assessment'}
              {step === 'completing' && 'Processing your results...'}
            </LunaDialogDescription>
          </LunaDialogHeader>
        )}

        <LunaDialogBody className={step === 'assessment' ? 'p-0 h-full' : ''}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Overview Step */}
          {step === 'overview' && (
            <OverviewScreen
              loading={loading}
              onStart={handleStartAssessment}
              onClose={onClose}
            />
          )}

          {/* Assessment Step - jsPsych Container */}
          {step === 'assessment' && (
            <div ref={jsPsychContainerRef} className="w-full h-full" id="jspsych-target" />
          )}

          {/* Completing Step */}
          {step === 'completing' && (
            <CompletingScreen />
          )}
        </LunaDialogBody>
      </LunaDialogContent>
    </LunaDialog>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

function OverviewScreen({
  loading,
  onStart,
  onClose,
}: {
  loading: boolean;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="prose prose-sm max-w-none">
        <p className="text-luna-gray-700">
          This assessment measures your cognitive abilities across four key domains using validated items
          from the International Cognitive Ability Resource (ICAR).
        </p>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-1">Verbal Reasoning</h4>
            <p className="text-sm text-blue-700">10 questions • ~45s each</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-1">Numerical Reasoning</h4>
            <p className="text-sm text-green-700">10 questions • ~60s each</p>
          </div>
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-1">Abstract Reasoning</h4>
            <p className="text-sm text-purple-700">10 questions • ~90s each</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-semibold text-orange-900 mb-1">Attention to Detail</h4>
            <p className="text-sm text-orange-700">10 questions • ~30s each</p>
          </div>
        </div>

        <div className="bg-luna-gray-50 border border-luna-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-luna-gray-900 mb-3">What to Expect</h4>
          <ul className="space-y-2 text-sm text-luna-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>40 questions total</strong> across 4 cognitive domains</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>15-20 minutes</strong> to complete</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Practice questions</strong> with feedback before each domain</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Suggested time per question</strong> shown as countdown timer</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Auto-save</strong> - your progress is saved automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Brief breaks</strong> between domains to rest</span>
            </li>
          </ul>
        </div>

        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Important:</strong> Find a quiet environment and ensure you won't be interrupted.
            While there are no hard time limits, working efficiently is part of the assessment.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-between gap-3">
        <LunaButton variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </LunaButton>
        <LunaButton
          onClick={onStart}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Starting...
            </>
          ) : (
            'Start Assessment'
          )}
        </LunaButton>
      </div>
    </div>
  );
}

function CompletingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-luna-gray-900 mb-2">
          Processing Your Results
        </h3>
        <p className="text-sm text-luna-gray-600">
          Calculating scores and generating insights...
        </p>
      </div>
    </div>
  );
}

