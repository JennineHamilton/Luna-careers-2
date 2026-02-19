'use client';

import { useState, useEffect } from 'react';
import { LunaButton } from '@/components/luna/button';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Trophy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogBody,
} from '@/components/luna';

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: 'true_false' | 'single_choice' | 'multiple_choice';
  image_url?: string | null;
  order_index: number;
  quiz_question_options: QuizQuestionOption[];
}

interface QuizQuestionOption {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

interface Quiz {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  number_of_questions: number;
  is_graded: boolean;
  passing_score?: number | null;
  quiz_questions: QuizQuestion[];
}

interface QuizPlayerProps {
  quiz: Quiz;
  userId: string;
  onComplete: (attemptId: string, score: number, passed: boolean) => void;
}

export function QuizPlayer({ quiz, userId, onComplete }: QuizPlayerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [selectedQuestions, setSelectedQuestions] = useState<QuizQuestion[]>([]);
  const [renderKey, setRenderKey] = useState(0);
  const [isLoadingAttempt, setIsLoadingAttempt] = useState(true);
  const [existingAttempt, setExistingAttempt] = useState<any>(null);
  const [showRetakeModal, setShowRetakeModal] = useState(false);

  // Fetch existing quiz attempt on mount
  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await fetch(`/api/learning/quiz-attempts?quiz_id=${quiz.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.attempt) {
            setExistingAttempt(data.attempt);
            setScore(data.attempt.percentage);
            setPassed(data.attempt.passed);
            setShowResults(true);
            setAnimatedScore(0); // Will animate to score
          }
        }
      } catch (error) {
        console.error('Error fetching quiz attempt:', error);
      } finally {
        setIsLoadingAttempt(false);
      }
    };

    fetchAttempt();
  }, [quiz.id]);

  // Initialize and randomize questions based on quiz settings
  useEffect(() => {
    if (!quiz?.quiz_questions) return;
    if (existingAttempt) return; // Don't randomize if showing existing attempt

    // Sort questions by order_index first
    const allQuestions = [...quiz.quiz_questions].sort((a, b) => a.order_index - b.order_index);

    // Randomize questions
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);

    // Select the number of questions specified in the quiz settings
    const questionsToUse = shuffled.slice(0, quiz.number_of_questions);

    console.log('[QuizPlayer] Initialized quiz:', {
      totalQuestions: allQuestions.length,
      numberToServe: quiz.number_of_questions,
      selectedCount: questionsToUse.length,
    });

    setSelectedQuestions(questionsToUse);
  }, [quiz, existingAttempt]);

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === selectedQuestions.length - 1;
  const currentAnswer = answers[currentQuestion?.id] || [];

  // Debug: Log when answers change
  useEffect(() => {
    console.log('[QuizPlayer] Answers state changed:', answers);
  }, [answers]);

  // Animate score counting
  useEffect(() => {
    if (showResults && animatedScore < score) {
      const timer = setTimeout(() => {
        setAnimatedScore(prev => Math.min(prev + 1, score));
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [showResults, animatedScore, score]);

  const handleAnswerSelect = (optionId: string) => {
    if (!currentQuestion) return;

    console.log('[QuizPlayer] Answer selected:', {
      questionId: currentQuestion.id,
      optionId,
      questionType: currentQuestion.question_type,
    });

    if (currentQuestion.question_type === 'multiple_choice') {
      // Toggle selection for multiple choice
      setAnswers(prev => {
        const currentAnswers = prev[currentQuestion.id] || [];
        const newAnswers = {
          ...prev,
          [currentQuestion.id]: currentAnswers.includes(optionId)
            ? currentAnswers.filter(id => id !== optionId)
            : [...currentAnswers, optionId]
        };
        console.log('[QuizPlayer] New answers:', newAnswers[currentQuestion.id]);
        return newAnswers;
      });
    } else {
      // Single selection for true/false and single choice
      setAnswers(prev => {
        const newAnswers = {
          ...prev,
          [currentQuestion.id]: [optionId]
        };
        console.log('[QuizPlayer] New answers:', newAnswers[currentQuestion.id]);
        return newAnswers;
      });
    }

    // Force re-render
    setRenderKey(prev => prev + 1);
  };

  const handleRetakeQuiz = () => {
    // Reset all state
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
    setScore(0);
    setAnimatedScore(0);
    setPassed(false);
    setStartTime(Date.now());
    setExistingAttempt(null);
    setShowRetakeModal(false);

    // Re-randomize questions
    if (!quiz?.quiz_questions) return;
    const allQuestions = [...quiz.quiz_questions].sort((a, b) => a.order_index - b.order_index);
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const questionsToUse = shuffled.slice(0, quiz.number_of_questions);
    setSelectedQuestions(questionsToUse);
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
    setIsSubmitting(true);

    try {
      // Calculate score
      let correctAnswers = 0;
      const totalQuestions = selectedQuestions.length;

      selectedQuestions.forEach(question => {
        const userAnswer = answers[question.id] || [];
        const correctOptions = question.quiz_question_options
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
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      const isPassed = quiz.passing_score ? percentage >= quiz.passing_score : true;

      setScore(percentage);
      setPassed(isPassed);

      // Save attempt to database
      const requestBody = {
        quiz_id: quiz.id,
        user_id: userId,
        score: correctAnswers,
        total_questions: totalQuestions,
        percentage,
        passed: isPassed,
        time_taken_seconds: timeTaken,
        answers: Object.entries(answers).map(([questionId, selectedOptionIds]) => ({
          question_id: questionId,
          selected_option_ids: selectedOptionIds,
        })),
      };

      console.log('[QuizPlayer] Submitting quiz attempt:', {
        quiz_id: quiz.id,
        user_id: userId,
        score: correctAnswers,
        total_questions: totalQuestions,
        percentage,
        passed: isPassed,
      });

      const response = await fetch('/api/learning/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz attempt');
      }

      const data = await response.json();

      // Show results with animation
      setShowResults(true);

      // Store the attempt so we don't call onComplete again
      setExistingAttempt(data);

      // Don't call onComplete - let user stay on results screen
      // They can click "Retake Quiz" or navigate away manually
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAttempt) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-luna-gray-900">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz || (!currentQuestion && !showResults)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-luna-gray-900">No questions available</p>
          <p className="text-sm text-luna-gray-600">
            {!quiz ? 'Quiz data not loaded.' : 'This quiz doesn\'t have any questions yet.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Results Screen */}
      {showResults ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Trophy Icon */}
            <div className="flex justify-center">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center",
                passed ? "bg-green-100" : "bg-orange-100"
              )}>
                <Trophy className={cn(
                  "w-12 h-12",
                  passed ? "text-green-600" : "text-orange-600"
                )} />
              </div>
            </div>

            {/* Score Display */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-luna-gray-900">
                Quiz Complete!
              </h2>
              <div className="text-6xl font-bold text-luna-primary-600">
                {animatedScore}%
              </div>
              <p className={cn(
                "text-xl font-semibold",
                passed ? "text-green-600" : "text-orange-600"
              )}>
                {passed ? "Passed!" : "Not Passed"}
              </p>
            </div>

            {/* Additional Info */}
            {quiz.passing_score && (
              <p className="text-luna-gray-600">
                Passing score: {quiz.passing_score}%
              </p>
            )}

            {/* Retake Button */}
            <div className="pt-4">
              <LunaButton
                onClick={() => setShowRetakeModal(true)}
                variant="outline"
                size="lg"
              >
                Retake Quiz
              </LunaButton>
            </div>
          </div>
        </div>
      ) : (
        <>
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
              <div className="space-y-3" key={`answers-${currentQuestion.id}-${renderKey}`}>
                {currentQuestion.question_type === 'true_false' ? (
                  // True/False Options
                  <>
                    {['True', 'False'].map((option, index) => {
                      const optionData = currentQuestion.quiz_question_options.find(
                        opt => opt.option_text.toLowerCase() === option.toLowerCase()
                      );
                      if (!optionData) return null;

                      const isSelected = currentAnswer.includes(optionData.id);

                      return (
                        <button
                          type="button"
                          key={`${optionData.id}-${isSelected}`}
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
                  // Single Choice or Multiple Choice Options
                  <>
                    {[...currentQuestion.quiz_question_options]
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((option, index) => {
                        const isSelected = currentAnswer.includes(option.id);
                        const isMultipleChoice = currentQuestion.question_type === 'multiple_choice';

                        return (
                          <button
                            type="button"
                            key={`${option.id}-${isSelected}`}
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
                                isMultipleChoice ? "rounded" : "rounded-full",
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              )}>
                                {isSelected && (
                                  isMultipleChoice ? (
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
                  Submit Quiz
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
        </>
      )}

      {/* Retake Confirmation Modal */}
      <LunaDialog
        open={showRetakeModal}
        onOpenChange={setShowRetakeModal}
      >
        <LunaDialogContent>
          <LunaDialogHeader>
            <LunaDialogTitle>Retake Quiz?</LunaDialogTitle>
          </LunaDialogHeader>
          <LunaDialogBody>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  <AlertTriangle className="w-6 h-6 text-orange-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    Are you sure you want to retake this quiz? Your current score of <strong>{score}%</strong> will be replaced with your new score.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <LunaButton
                  variant="outline"
                  onClick={() => setShowRetakeModal(false)}
                >
                  Cancel
                </LunaButton>
                <LunaButton
                  onClick={handleRetakeQuiz}
                >
                  Yes, Retake Quiz
                </LunaButton>
              </div>
            </div>
          </LunaDialogBody>
        </LunaDialogContent>
      </LunaDialog>
    </div>
  );
}
