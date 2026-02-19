/**
 * Professional Personality Profile Assessment Modal
 * Follows Luna Design System modal pattern (like create-organization-modal)
 */

'use client';

import { useState, useEffect } from 'react';
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
import { Brain, Clock, FileText, Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

interface PersonalityAssessmentModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (attemptId: string) => void;
}

interface Question {
  id: string;
  question_number: number;
  question_text: string;
  dimension: string;
  is_reversed: boolean;
}

type Step = 'overview' | 'assessment';

export function PersonalityAssessmentModal({
  open,
  onClose,
  onComplete,
}: PersonalityAssessmentModalProps) {
  const [step, setStep] = useState<Step>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Assessment state
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [startTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer effect
  useEffect(() => {
    if (step === 'assessment' && attemptId) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, attemptId, startTime]);

  // Load questions when assessment starts
  useEffect(() => {
    if (step === 'assessment' && questions.length === 0) {
      loadQuestions();
    }
  }, [step]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('overview');
      setAttemptId(null);
      setQuestions([]);
      setCurrentIndex(0);
      setResponses({});
      setError('');
    }
  }, [open]);

  const loadQuestions = async () => {
    try {
      const response = await fetch('/api/personality/questions');
      if (!response.ok) throw new Error('Failed to load questions');

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error loading questions:', err);
      setError('Failed to load questions. Please try again.');
    }
  };

  const handleStartAssessment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/personality/start', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start assessment');
      }

      const data = await response.json();
      setAttemptId(data.attempt_id);
      setStep('assessment');
    } catch (err) {
      console.error('Error starting assessment:', err);
      setError(err instanceof Error ? err.message : 'Failed to start assessment');
    } finally {
      setLoading(false);
    }
  };

  // Handle response selection (just update local state, don't save yet)
  const handleResponse = (value: number) => {
    if (!questions[currentIndex]) return;

    const question = questions[currentIndex];

    // Update local state only - don't save until user clicks Next
    setResponses(prev => ({
      ...prev,
      [question.id]: value
    }));

    // Clear any previous errors
    setError('');
  };

  // Save response and move to next question
  const handleNextQuestion = async () => {
    if (!questions[currentIndex] || !attemptId || !currentResponse) return;

    const question = questions[currentIndex];
    const responseTime = Date.now() - startTime;

    setLoading(true);
    setError('');

    try {
      // Save the current response
      const res = await fetch('/api/personality/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          question_id: question.id,
          response_value: currentResponse,
          response_time_ms: responseTime
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save response');
      }

      // Move to next question AFTER successful save
      setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1));
    } catch (err) {
      console.error('Error saving response:', err);
      setError('Failed to save response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAssessment = async () => {
    if (!attemptId || !questions[currentIndex]) return;

    const question = questions[currentIndex];
    const responseValue = responses[question.id];

    // If there's an unsaved response on the last question, save it first
    if (currentIndex === questions.length - 1 && responseValue) {
      setLoading(true);
      setError('');

      try {
        // Save the final response
        const responseTime = Date.now() - startTime;
        const saveRes = await fetch('/api/personality/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: question.id,
            response_value: responseValue,
            response_time_ms: responseTime
          })
        });

        if (!saveRes.ok) {
          throw new Error('Failed to save final response');
        }

        // Now complete the assessment
        const completeRes = await fetch('/api/personality/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId })
        });

        if (!completeRes.ok) {
          const errorData = await completeRes.json();
          console.error('Complete assessment error:', errorData);
          throw new Error(errorData.error || 'Failed to complete assessment');
        }

        onComplete(attemptId);
      } catch (err) {
        console.error('Error completing assessment:', err);
        setError(err instanceof Error ? err.message : 'Failed to complete assessment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClose = () => {
    setStep('overview');
    setAttemptId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setResponses({});
    setError('');
    onClose();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format IPIP question text into proper conversational sentence
   * IPIP questions are verb phrases (e.g., "Am quiet around strangers.")
   * We convert them to first-person statements: "I am quiet around strangers."
   */
  const formatQuestionText = (questionText: string): string => {
    // Remove trailing period if present
    const cleanText = questionText.trim().replace(/\.$/, '');

    // Convert first letter to lowercase for proper grammar
    const lowercaseText = cleanText.charAt(0).toLowerCase() + cleanText.slice(1);

    // Add "I " prefix to create first-person statement
    return `I ${lowercaseText}.`;
  };

  /**
   * Get simplified, accessible version of question for better understanding
   * Maintains the same psychological meaning but uses simpler vocabulary
   */
  const getSimplifiedQuestion = (questionText: string): string => {
    const simplified: Record<string, string> = {
      // Extraversion questions
      "Am the life of the party.": "I am energetic and fun at social gatherings.",
      "Don't talk a lot.": "I prefer to listen rather than speak often.",
      "Feel comfortable around people.": "I feel relaxed and at ease when I'm with others.",
      "Keep in the background.": "I prefer to stay quiet and not draw attention to myself.",
      "Start conversations.": "I am usually the one who begins talking to others.",
      "Have little to say.": "I don't speak much in conversations.",
      "Talk to a lot of different people at parties.": "I enjoy meeting and chatting with many people at social events.",
      "Don't like to draw attention to myself.": "I prefer not to be the center of attention.",
      "Don't mind being the center of attention.": "I am comfortable when people are focused on me.",
      "Am quiet around strangers.": "I don't talk much when I'm around people I don't know.",

      // Agreeableness questions
      "Feel little concern for others.": "I don't worry much about other people's problems.",
      "Am interested in people.": "I enjoy learning about others and their lives.",
      "Insult people.": "I sometimes say mean or hurtful things to others.",
      "Sympathize with others' feelings.": "I understand and care about how others feel.",
      "Am not interested in other people's problems.": "I don't pay much attention to what others are going through.",
      "Have a soft heart.": "I am kind and easily moved by others' emotions.",
      "Am not really interested in others.": "I don't care much about other people.",
      "Take time out for others.": "I make time to help and support people.",
      "Feel others' emotions.": "I can sense and understand what others are feeling.",
      "Make people feel at ease.": "I help others feel comfortable and relaxed.",

      // Conscientiousness questions
      "Am always prepared.": "I plan ahead and get things ready in advance.",
      "Leave my belongings around.": "I don't put my things away in their proper place.",
      "Pay attention to details.": "I notice small things and am careful about accuracy.",
      "Make a mess of things.": "I sometimes do things poorly or create disorder.",
      "Get chores done right away.": "I complete tasks and responsibilities quickly without delay.",
      "Often forget to put things back in their proper place.": "I frequently don't return items to where they belong.",
      "Like order.": "I prefer things to be organized and neat.",
      "Shirk my duties.": "I avoid or neglect my responsibilities.",
      "Follow a schedule.": "I stick to a plan and do things at set times.",
      "Am exacting in my work.": "I am very careful and precise when doing my work.",

      // Emotional Stability questions
      "Get stressed out easily.": "I become worried or anxious quickly when things are difficult.",
      "Am relaxed most of the time.": "I usually feel calm and not worried.",
      "Worry about things.": "I think about problems and feel concerned often.",
      "Seldom feel blue.": "I rarely feel sad or down.",
      "Am easily disturbed.": "Small problems or changes upset me quickly.",
      "Get upset easily.": "I become bothered or troubled without much reason.",
      "Change my mood a lot.": "My feelings shift frequently from happy to sad.",
      "Have frequent mood swings.": "My emotions change often and unpredictably.",
      "Get irritated easily.": "I become annoyed or frustrated quickly.",
      "Often feel blue.": "I frequently feel sad or unhappy.",

      // Intellect/Imagination questions
      "Have a rich vocabulary.": "I know and use many different words.",
      "Have difficulty understanding abstract ideas.": "I find it hard to understand concepts that aren't concrete or practical.",
      "Have a vivid imagination.": "I can easily picture creative ideas and scenarios in my mind.",
      "Am not interested in abstract ideas.": "I don't enjoy thinking about theoretical or philosophical concepts.",
      "Have excellent ideas.": "I come up with creative and valuable thoughts.",
      "Do not have a good imagination.": "I find it difficult to think creatively or picture new things.",
      "Am quick to understand things.": "I learn and grasp new information easily.",
      "Use difficult words.": "I often use complex or uncommon vocabulary.",
      "Spend time reflecting on things.": "I think deeply about ideas and experiences.",
      "Am full of ideas.": "I have many creative thoughts and suggestions."
    };

    return simplified[questionText] || formatQuestionText(questionText);
  };

  const currentQuestion = questions[currentIndex];
  // Progress is based on currentIndex (saved questions), not just selected responses
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;
  const currentResponse = currentQuestion ? responses[currentQuestion.id] : undefined;

  return (
    <LunaDialog open={open} onOpenChange={onClose}>
      <LunaDialogContent className="max-w-4xl">
        {/* Header with title and step indicator */}
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-luna-blue" />
            Professional Personality Profile
          </LunaDialogTitle>
          {step === 'overview' ? (
            <LunaDialogDescription>
              Discover your professional personality traits and career fit
            </LunaDialogDescription>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <LunaDialogDescription>
                Question {currentIndex + 1} of {questions.length} • {Math.round(progress)}% Complete
              </LunaDialogDescription>
              <span className="text-sm text-luna-gray-600">
                Time Elapsed: <span className="font-semibold text-luna-blue">{formatTime(elapsedSeconds)}</span>
              </span>
            </div>
          )}
        </LunaDialogHeader>

        {/* Body with form content */}
        <LunaDialogBody className="text-sm">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'overview' ? (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold text-luna-gray-900 mb-2">
                  Welcome to the Professional Personality Profile
                </h3>
                <p className="text-luna-gray-600">
                  This assessment will help you understand your unique personality traits and how they align with different career paths.
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-luna-gray-50 border border-luna-gray-200 rounded-lg p-4 text-center">
                  <FileText className="h-8 w-8 text-luna-blue mx-auto mb-2" />
                  <p className="text-2xl font-bold text-luna-gray-900">50</p>
                  <p className="text-sm text-luna-gray-600">Questions</p>
                </div>
                <div className="bg-luna-gray-50 border border-luna-gray-200 rounded-lg p-4 text-center">
                  <Clock className="h-8 w-8 text-luna-blue mx-auto mb-2" />
                  <p className="text-2xl font-bold text-luna-gray-900">10-15</p>
                  <p className="text-sm text-luna-gray-600">Minutes</p>
                </div>
              </div>

              {/* Assessment Guidelines */}
              <div className="bg-white border border-luna-gray-200 rounded-lg p-5">
                <h4 className="font-semibold text-luna-gray-900 mb-3">Assessment Guidelines</h4>
                <ol className="space-y-2 text-luna-gray-700">
                  <li className="flex gap-3">
                    <span className="font-semibold text-luna-blue">1.</span>
                    <span><strong>Answer Honestly:</strong> There are no right or wrong answers. Choose responses that best describe you.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-luna-blue">2.</span>
                    <span><strong>Confidential Responses:</strong> Your answers are private and used only to generate your personalized reports.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-luna-blue">3.</span>
                    <span><strong>Navigate Freely:</strong> Use Previous and Next buttons to review and change your answers.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-luna-blue">4.</span>
                    <span><strong>Four Detailed Reports:</strong> Receive comprehensive insights into your personality, work style, career fit, and development areas.</span>
                  </li>
                </ol>
              </div>

              {/* Scientific Validation Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Scientifically Validated</p>
                  <p className="text-blue-700">
                    Based on the IPIP-50 assessment (Goldberg, 1992), a research-validated measure of the Big Five personality dimensions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {loading && questions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-luna-blue" />
                </div>
              ) : currentQuestion ? (
                <>
                  {/* Progress Bar */}
                  <div>
                    <div className="h-2 bg-luna-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-luna-blue to-blue-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Question - Compact, No Border */}
                  <div className="py-4">
                    {/* IPIP Question (Original) */}
                    <p className="text-xl font-normal text-luna-gray-900 mb-3 text-center leading-relaxed max-w-3xl mx-auto">
                      {formatQuestionText(currentQuestion.question_text)}
                    </p>

                    {/* Simplified Version for Context */}
                    <p className="text-sm text-luna-gray-600 mb-8 text-center leading-relaxed max-w-2xl mx-auto italic">
                      {getSimplifiedQuestion(currentQuestion.question_text)}
                    </p>

                    {/* Horizontal Likert Scale - Neutral Luna Colors */}
                    <div className="flex items-stretch justify-between gap-3 max-w-4xl mx-auto">
                      {[
                        { value: 1, label: 'Strongly Disagree' },
                        { value: 2, label: 'Disagree' },
                        { value: 3, label: 'Neutral' },
                        { value: 4, label: 'Agree' },
                        { value: 5, label: 'Strongly Agree' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleResponse(value)}
                          className={`flex-1 flex flex-col items-center gap-2.5 p-4 rounded-lg border-2 transition-all duration-200 ${
                            currentResponse === value
                              ? 'border-luna-blue bg-luna-blue/5 shadow-md scale-105'
                              : 'border-luna-gray-300 bg-white hover:border-luna-blue/50 hover:bg-luna-gray-50'
                          }`}
                        >
                          {/* Number Circle */}
                          <div
                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-base font-semibold transition-all duration-200 ${
                              currentResponse === value
                                ? 'border-luna-blue bg-luna-blue text-white'
                                : 'border-luna-gray-400 bg-white text-luna-gray-700'
                            }`}
                          >
                            {value}
                          </div>

                          {/* Label */}
                          <span
                            className={`text-xs font-medium text-center leading-tight transition-colors duration-200 ${
                              currentResponse === value
                                ? 'text-luna-blue'
                                : 'text-luna-gray-600'
                            }`}
                          >
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </LunaDialogBody>

        {/* Footer with action buttons */}
        <LunaDialogFooter>
          {step === 'overview' ? (
            <>
              <LunaButton
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </LunaButton>
              <LunaButton
                type="button"
                onClick={handleStartAssessment}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Assessment...
                  </>
                ) : (
                  'Start Assessment'
                )}
              </LunaButton>
            </>
          ) : (
            <>
              <LunaButton
                type="button"
                variant="secondary"
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0 || loading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </LunaButton>

              {/* Show Complete button when on last question AND response is selected */}
              {currentIndex === questions.length - 1 && currentResponse ? (
                <LunaButton
                  type="button"
                  onClick={handleCompleteAssessment}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete Assessment
                    </>
                  )}
                </LunaButton>
              ) : (
                <LunaButton
                  type="button"
                  onClick={handleNextQuestion}
                  disabled={!currentResponse || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next Question
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </LunaButton>
              )}
            </>
          )}
        </LunaDialogFooter>
      </LunaDialogContent>
    </LunaDialog>
  );
}