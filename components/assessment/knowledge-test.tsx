'use client';

import { useState, useEffect, useRef } from 'react';
import { LunaButton } from '@/components/luna/button';
import { Clock, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface KnowledgeQuestion {
  id: string;
  question_text: string;
  question_type: 'true_false' | 'single_select' | 'multiple_select';
  image_url: string | null;
  options: {
    id: string;
    option_text: string;
    is_correct: boolean;
    order_index: number;
  }[];
}

interface KnowledgeTestProps {
  assessmentId: string;
  questions: KnowledgeQuestion[];
  timeLimit: number; // in minutes
  allowReview: boolean;
  passingThreshold: number; // percentage required to pass
  onComplete: (results: any) => void;
  onCancel: () => void;
}

export function KnowledgeTest({
  assessmentId,
  questions,
  timeLimit,
  allowReview,
  passingThreshold,
  onComplete,
  onCancel,
}: KnowledgeTestProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // Convert to seconds
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<KnowledgeQuestion[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === selectedQuestions.length - 1;
  const currentAnswer = answers[currentQuestion?.id] || [];

  // Initialize and randomize questions
  useEffect(() => {
    if (!questions || questions.length === 0) return;

    // Randomize questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setSelectedQuestions(shuffled);

    console.log('[KnowledgeTest] Initialized assessment:', {
      totalQuestions: questions.length,
      selectedCount: shuffled.length,
    });
  }, [questions]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTest = async () => {
    setHasStarted(true);
    startTimeRef.current = Date.now();

    // Create attempt
    try {
      const response = await fetch('/api/screening/knowledge/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          selected_question_ids: selectedQuestions.map(q => q.id),
        }),
      });

      if (!response.ok) {
        console.error('Failed to create attempt');
        return;
      }

      const data = await response.json();
      setAttemptId(data.attempt_id);
    } catch (error) {
      console.error('Error creating attempt:', error);
    }

    // Start timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimeUp = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    handleSubmit();
  };

  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion) return;

    const questionType = currentQuestion.question_type;
    const currentAnswers = answers[currentQuestion.id] || [];

    let newAnswers: string[];

    if (questionType === 'true_false' || questionType === 'single_select') {
      // Single selection - replace with new selection
      newAnswers = [optionId];
    } else {
      // Multiple selection - toggle
      if (currentAnswers.includes(optionId)) {
        newAnswers = currentAnswers.filter(id => id !== optionId);
      } else {
        newAnswers = [...currentAnswers, optionId];
      }
    }

    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: newAnswers,
    }));

    console.log('[KnowledgeTest] Answer updated:', {
      questionId: currentQuestion.id,
      questionType,
      newAnswers,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || !attemptId) return;

    setIsSubmitting(true);

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      const timeElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = selectedQuestions.length;

      selectedQuestions.forEach(question => {
        const userAnswer = answers[question.id] || [];
        const correctOptions = question.options
          .filter(opt => opt.is_correct)
          .map(opt => opt.id)
          .sort();

        const userAnswerSorted = [...userAnswer].sort();

        // Check if answer is correct (all correct options selected, no incorrect ones)
        if (JSON.stringify(correctOptions) === JSON.stringify(userAnswerSorted)) {
          correctAnswers++;
        }
      });

      const percentage = Math.round((correctAnswers / totalQuestions) * 100);
      const isPassed = percentage >= passingThreshold;

      // Format answers for submission
      const formattedAnswers = selectedQuestions.map((q) => {
        const userAnswer = answers[q.id] || [];

        // For true/false questions, convert option ID to boolean
        if (q.question_type === 'true_false' && userAnswer.length > 0) {
          const selectedOption = q.options.find(opt => opt.id === userAnswer[0]);
          return {
            question_id: q.id,
            selected_option_ids: [],
            selected_boolean: selectedOption?.option_text.toLowerCase() === 'true',
          };
        }

        // For single/multiple select
        return {
          question_id: q.id,
          selected_option_ids: userAnswer,
          selected_boolean: null,
        };
      });

      console.log('[KnowledgeTest] Submitting assessment:', {
        assessment_id: assessmentId,
        attempt_id: attemptId,
        score: correctAnswers,
        total_questions: totalQuestions,
        percentage,
        passed: isPassed,
      });

      const response = await fetch('/api/screening/knowledge/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          answers: formattedAnswers,
          time_in_milliseconds: timeElapsed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit attempt');
      }

      const data = await response.json();

      // Call onComplete immediately with formatted data for the results modal
      onComplete({
        attempt_id: attemptId,
        correct_answers: data.correct_count,
        total_questions: data.total_questions,
        score_percentage: data.score,
        passed: data.passed,
        time_in_milliseconds: timeElapsed,
        assessment_title: assessmentId, // This will be replaced by the actual title in the modal
      });
    } catch (error) {
      console.error('Error submitting attempt:', error);
      alert('Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  // Loading state while questions are being randomized
  if (!selectedQuestions || selectedQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-luna-gray-600">Loading assessment...</p>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-semibold text-luna-gray-900">Ready to Begin?</h3>
          <p className="text-luna-gray-600">
            You have {timeLimit} minutes to complete {selectedQuestions.length} questions.
          </p>
          <p className="text-sm text-luna-gray-500">
            Passing score: {passingThreshold}%
          </p>
          {allowReview && (
            <p className="text-sm text-luna-gray-500">
              You can navigate between questions before submitting.
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <LunaButton variant="outline" onClick={onCancel}>
            Cancel
          </LunaButton>
          <LunaButton onClick={startTest}>
            Start Assessment
          </LunaButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header with timer */}
      <div className="flex items-center justify-between p-4 border-b border-luna-border-default bg-white">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-luna-gray-500" />
              <span className="text-lg font-medium text-luna-gray-900">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <div className="text-sm text-luna-gray-600">
              {getAnsweredCount()} / {selectedQuestions.length} Answered
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Question Number */}
              <div className="text-sm font-medium text-luna-gray-500">
                Question {currentQuestionIndex + 1} of {selectedQuestions.length}
              </div>

              {/* Question Text */}
              <h2 className="text-2xl font-semibold text-luna-gray-900">
                {currentQuestion.question_text}
              </h2>

              {/* Question Image */}
              {currentQuestion.image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-luna-border-default">
                  <Image
                    src={currentQuestion.image_url}
                    alt="Question image"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.question_type === 'true_false' ? (
                  // True/False Options
                  <>
                    {['True', 'False'].map((option) => {
                      const optionData = currentQuestion.options.find(
                        opt => opt.option_text.toLowerCase() === option.toLowerCase()
                      );
                      if (!optionData) return null;

                      const isSelected = currentAnswer.includes(optionData.id);

                      return (
                        <button
                          type="button"
                          key={optionData.id}
                          onClick={() => handleAnswerSelect(optionData.id)}
                          className={cn(
                            "w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer",
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            )}>
                              {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <span className="text-base font-medium text-gray-900">
                              {option}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  // Single Select or Multiple Select Options
                  <>
                    {[...currentQuestion.options]
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((option) => {
                        const isSelected = currentAnswer.includes(option.id);
                        const isMultipleSelect = currentQuestion.question_type === 'multiple_select';

                        return (
                          <button
                            type="button"
                            key={option.id}
                            onClick={() => handleAnswerSelect(option.id)}
                            className={cn(
                              "w-full p-4 rounded-lg border-2 text-left transition-all cursor-pointer",
                              isSelected
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 flex items-center justify-center border-2",
                                isMultipleSelect ? "rounded" : "rounded-full",
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              )}>
                                {isSelected && (
                                  isMultipleSelect ? (
                                    <CheckCircle className="w-4 h-4 text-white" />
                                  ) : (
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                  )
                                )}
                              </div>
                              <span className="text-base font-medium text-gray-900">
                                {option.option_text}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                  </>
                )}

              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="border-t border-luna-border-default bg-white p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {/* Previous Button */}
              <LunaButton
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                size="md"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </LunaButton>

              {/* Progress Indicator */}
              <div className="text-sm font-medium text-luna-gray-600">
                {currentQuestionIndex + 1} / {selectedQuestions.length}
              </div>

              {/* Next or Submit Button */}
              {isLastQuestion ? (
                <LunaButton
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || currentAnswer.length === 0}
                  size="md"
                >
                  Submit Assessment
                </LunaButton>
              ) : (
                <LunaButton
                  onClick={handleNext}
                  disabled={currentAnswer.length === 0}
                  size="md"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </LunaButton>
              )}
            </div>
          </div>
    </div>
  );
}

