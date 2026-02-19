'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { createClient } from '@/lib/supabase/client';
import { LMSSidebar, type LMSModule, type LMSLesson } from '@/components/luna/learning/lms-sidebar';
import { ScormApiAdapter, type ScormData } from '@/components/luna/learning/scorm-api-adapter';
import { QuizPlayer } from '@/components/luna/learning/quiz-player';
import { LunaButton, LunaBadge } from '@/components/luna';
import { CheckCircle, ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { useLayout } from '@/components/hooks/useLayout';

type Module = Database['public']['Tables']['modules']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'];

interface ModuleLearnClientProps {
  module: any;
  currentLesson: Lesson | null;
  currentQuiz: any | null; // Quiz with questions
  currentItemType?: 'lesson' | 'quiz';
  scormUrl: string;
  lessonProgress: any[];
  quizAttempts: any[];
  moduleProgress: any;
  userId: string;
}

export function ModuleLearnClient({
  module,
  currentLesson,
  currentQuiz,
  currentItemType,
  scormUrl,
  lessonProgress,
  quizAttempts,
  moduleProgress,
  userId,
}: ModuleLearnClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [scormCompleted, setScormCompleted] = useState(false);
  const [scormData, setScormData] = useState<ScormData | null>(null);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isLmsSidebarCollapsed, setIsLmsSidebarCollapsed] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isSidebarCollapsed, isMobile } = useLayout();

  // Handle iframe load events
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setIframeLoaded(true);
    };

    const handleError = () => {
      console.error('[SCORM] Iframe failed to load');
      setIframeLoading(false);
      setIframeError(true);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
    };
  }, [scormUrl]);

  // Reset loading state when URL changes
  useEffect(() => {
    setIframeLoading(true);
    setIframeError(false);
    setLoadingProgress(0);
    setIframeLoaded(false);
    setIsFadingOut(false);
  }, [scormUrl]);

  // Simulate progress bar (since we can't track actual iframe loading progress)
  useEffect(() => {
    if (!iframeLoading) {
      return;
    }

    setLoadingProgress(0);

    // Simulate progress: 0% -> 95% gradually
    const timer1 = setTimeout(() => setLoadingProgress(30), 500);
    const timer2 = setTimeout(() => setLoadingProgress(50), 2000);
    const timer3 = setTimeout(() => setLoadingProgress(65), 5000);
    const timer4 = setTimeout(() => setLoadingProgress(75), 10000);
    const timer5 = setTimeout(() => setLoadingProgress(85), 20000);
    const timer6 = setTimeout(() => setLoadingProgress(90), 40000);
    const timer7 = setTimeout(() => setLoadingProgress(95), 60000);
    // Stay at 95% until iframe actually loads

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      clearTimeout(timer7);
    };
  }, [iframeLoading]);

  // When iframe loads, complete the progress bar to 100% then gracefully fade out
  useEffect(() => {
    if (iframeLoaded && iframeLoading) {
      setLoadingProgress(100);

      // Wait 800ms at 100% to let user see completion
      const completeTimer = setTimeout(() => {
        setIsFadingOut(true);

        // After fade animation (1 second), remove overlay
        const fadeTimer = setTimeout(() => {
          setIframeLoading(false);
        }, 1000);

        return () => clearTimeout(fadeTimer);
      }, 800);

      return () => clearTimeout(completeTimer);
    }
  }, [iframeLoaded, iframeLoading]);

  // Reset SCORM completion state when lesson changes
  useEffect(() => {
    setScormCompleted(false);
    setScormData(null);
    setIsCompleted(false);
  }, [currentLesson?.id]);

  // Auto-complete lessons when SCORM reports completion
  useEffect(() => {
    if (scormCompleted && currentLesson && !isCompleted && !completing) {
      handleMarkComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scormCompleted]);

  // Build module data for sidebar with locked states - combine lessons and quizzes
  type ContentItem =
    | { type: 'lesson'; data: any; sort_order: number }
    | { type: 'quiz'; data: any; sort_order: number };

  const contentItems: ContentItem[] = [
    ...(module.module_lessons || []).map((ml: any) => ({
      type: 'lesson' as const,
      data: ml,
      sort_order: ml.sort_order,
    })),
    ...(module.module_quizzes || []).map((mq: any) => ({
      type: 'quiz' as const,
      data: mq,
      sort_order: mq.sort_order,
    })),
  ]
    .filter((item) => (item.type === 'lesson' && item.data.lessons) || (item.type === 'quiz' && item.data.quizzes))
    .sort((a, b) => a.sort_order - b.sort_order);

  const lessons: LMSLesson[] = contentItems.map((item, itemIndex) => {
    if (item.type === 'lesson') {
      const moduleLesson = item.data;
      const lesson = moduleLesson.lessons;
      const progress = lessonProgress.find((p: any) => p.lesson_id === lesson.id);
      const completed = progress?.status === 'completed' || progress?.status === 'passed';

      // Check if item is unlocked (first item is always unlocked)
      let isUnlocked = itemIndex === 0;
      if (itemIndex > 0) {
        const previousItem = contentItems[itemIndex - 1];
        if (previousItem.type === 'lesson') {
          const prevLesson = previousItem.data.lessons;
          const prevProgress = lessonProgress.find((p: any) => p.lesson_id === prevLesson.id);
          isUnlocked = prevProgress?.status === 'completed' || prevProgress?.status === 'passed';
        } else {
          const prevQuiz = previousItem.data.quizzes;
          const prevAttempts = quizAttempts.filter((qa: any) => qa.quiz_id === prevQuiz.id);
          const latestAttempt = prevAttempts[0];
          isUnlocked = latestAttempt?.completed_at != null;
        }
      }

      return {
        id: lesson.id,
        title: lesson.title,
        duration_minutes: lesson.duration_minutes,
        is_required: moduleLesson.is_required,
        sort_order: moduleLesson.sort_order,
        completed,
        locked: !isUnlocked,
        type: 'lesson' as const,
        quiz_score: progress?.score_raw || null,
      };
    } else {
      const moduleQuiz = item.data;
      const quiz = moduleQuiz.quizzes;
      const attempts = quizAttempts.filter((qa: any) => qa.quiz_id === quiz.id);
      const latestAttempt = attempts[0]; // Already sorted by started_at desc
      const completed = latestAttempt?.completed_at != null;

      // Check if item is unlocked (first item is always unlocked)
      let isUnlocked = itemIndex === 0;
      if (itemIndex > 0) {
        const previousItem = contentItems[itemIndex - 1];
        if (previousItem.type === 'lesson') {
          const prevLesson = previousItem.data.lessons;
          const prevProgress = lessonProgress.find((p: any) => p.lesson_id === prevLesson.id);
          isUnlocked = prevProgress?.status === 'completed' || prevProgress?.status === 'passed';
        } else {
          const prevQuiz = previousItem.data.quizzes;
          const prevAttempts = quizAttempts.filter((qa: any) => qa.quiz_id === prevQuiz.id);
          const prevLatestAttempt = prevAttempts[0];
          isUnlocked = prevLatestAttempt?.completed_at != null;
        }
      }

      return {
        id: quiz.id,
        title: quiz.name,
        duration_minutes: quiz.duration_minutes,
        is_required: moduleQuiz.is_required,
        sort_order: moduleQuiz.sort_order,
        completed,
        locked: !isUnlocked,
        type: 'quiz' as const,
        quiz_score: latestAttempt?.percentage || null,
        number_of_questions: quiz.number_of_questions,
      };
    }
  });

  const moduleData: LMSModule = {
    id: module.id,
    title: module.title,
    lessons,
    sort_order: 0,
    locked: false,
  };

  // Check if current lesson is completed
  useEffect(() => {
    if (!currentLesson) return;
    const progress = lessonProgress.find((p: any) => p.lesson_id === currentLesson.id);
    setIsCompleted(progress?.status === 'completed' || progress?.status === 'passed');
  }, [currentLesson, lessonProgress]);

  const handleLessonClick = (itemId: string, moduleId: string) => {
    // Determine if this is a lesson or quiz
    const item = lessons.find(l => l.id === itemId);
    if (!item) return;

    if (item.type === 'quiz') {
      router.push(`/u/learning/modules/${module.id}/learn?quiz=${itemId}`);
    } else {
      router.push(`/u/learning/modules/${module.id}/learn?lesson=${itemId}`);
    }
  };

  // Calculate completion percentage
  const completedLessons = lessons.filter(l => l.completed).length;
  const totalLessons = lessons.length;
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const handleMarkComplete = async () => {
    if (!currentLesson || completing) return;

    setCompleting(true);

    try {
      const supabase = createClient();

      // Prepare lesson progress data - only include fields that exist in the database
      const progressData: any = {
        user_id: userId,
        lesson_id: currentLesson.id,
        status: 'completed',
        completion_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      };

      // Add SCORM data if available - only fields that exist in lesson_progress table
      if (scormData) {
        if (scormData.score_raw !== null && scormData.score_raw !== undefined) {
          progressData.score_raw = scormData.score_raw;
        }
        if (scormData.score_min !== null && scormData.score_min !== undefined) {
          progressData.score_min = scormData.score_min;
        }
        if (scormData.score_max !== null && scormData.score_max !== undefined) {
          progressData.score_max = scormData.score_max;
        }
        if (scormData.passing_score !== null && scormData.passing_score !== undefined) {
          progressData.passing_score = scormData.passing_score;
        }
        // Store success_status in scorm_cmi_data instead of as a separate field
        if (scormData.cmi_data) {
          progressData.scorm_cmi_data = scormData.cmi_data;
        } else if (scormData.success_status) {
          progressData.scorm_cmi_data = { success_status: scormData.success_status };
        }
      }

      // Upsert lesson progress
      const { data, error } = await supabase
        .from('lesson_progress')
        .upsert(progressData, {
          onConflict: 'user_id,lesson_id',
        })
        .select();

      if (error) {
        console.error('Error saving lesson progress:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          error
        });
        throw error;
      }

      // Refresh the page to update progress
      router.refresh();
    } catch (error) {
      console.error('Error marking lesson complete:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setCompleting(false);
    }
  };

  const handleProgressUpdate = async (_progress: number) => {
    // Could implement auto-save here if needed
  };

  const handleQuizComplete = async (attemptId: string, score: number, passed: boolean) => {
    // Refresh the page to update progress and navigate to next item
    router.refresh();

    // Find the next unlocked item
    const currentIndex = lessons.findIndex(l => l.id === currentQuiz?.id);
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      const nextItem = lessons[currentIndex + 1];
      if (nextItem.type === 'quiz') {
        router.push(`/u/learning/modules/${module.id}/learn?quiz=${nextItem.id}`);
      } else {
        router.push(`/u/learning/modules/${module.id}/learn?lesson=${nextItem.id}`);
      }
    } else {
      // Last item completed, go back to module details
      router.push(`/u/learning/${module.id}`);
    }
  };

  if (!currentLesson && !currentQuiz) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No content available</h2>
          <p className="text-luna-gray-600">Please select a lesson or quiz from the sidebar.</p>
        </div>
      </div>
    );
  }

  // Calculate positioning based on main layout sidebar and header
  const mainSidebarWidth = isMobile ? 0 : (isSidebarCollapsed ? 64 : 250);
  const headerHeight = 65;
  const lmsSidebarWidth = isLmsSidebarCollapsed ? 64 : 320;

  return (
    <div
      className="fixed bg-luna-gray-50 flex overflow-hidden"
      style={{
        top: `${headerHeight}px`,
        left: `${mainSidebarWidth}px`,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Initialize SCORM API synchronously BEFORE iframe loads */}
      <Script
        id="scorm-api-init"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.API = {
              LMSInitialize: function() { return 'true'; },
              LMSFinish: function() { return 'true'; },
              LMSGetValue: function(element) { return ''; },
              LMSSetValue: function(element, value) { return 'true'; },
              LMSCommit: function() { return 'true'; },
              LMSGetLastError: function() { return '0'; },
              LMSGetErrorString: function() { return ''; },
              LMSGetDiagnostic: function() { return ''; }
            };
            window.API_1484_11 = {
              Initialize: function() { return 'true'; },
              Terminate: function() { return 'true'; },
              GetValue: function(element) { return ''; },
              SetValue: function(element, value) { return 'true'; },
              Commit: function() { return 'true'; },
              GetLastError: function() { return '0'; },
              GetErrorString: function() { return ''; },
              GetDiagnostic: function() { return ''; }
            };
          `
        }}
      />

      {/* SCORM API Adapter - Enhances the API with completion detection logic (only for lessons) */}
      {currentLesson && (
        <ScormApiAdapter
          lessonId={currentLesson.id}
          userId={userId}
          moduleId={module.id}
          onScormComplete={(data) => {
            setScormCompleted(true);
            setScormData(data);
          }}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* LMS Sidebar - Collapsible */}
      <div
        className="shrink-0 flex flex-col h-full border-r border-luna-border-default bg-white transition-all duration-300"
        style={{ width: `${lmsSidebarWidth}px` }}
      >
        {/* Collapse/Expand Button */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-luna-border-default">
          {!isLmsSidebarCollapsed && (
            <h2 className="text-sm font-semibold text-luna-gray-900">Course Content</h2>
          )}
          <button
            onClick={() => setIsLmsSidebarCollapsed(!isLmsSidebarCollapsed)}
            className="p-1.5 rounded-md hover:bg-luna-gray-100 transition-colors ml-auto"
            aria-label={isLmsSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isLmsSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-luna-gray-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-luna-gray-600" />
            )}
          </button>
        </div>

        {/* Sidebar Content */}
        <LMSSidebar
          courseTitle={module.title}
          modules={[moduleData]}
          currentLessonId={currentLesson?.id || currentQuiz?.id || ''}
          completionPercentage={completionPercentage}
          onLessonClick={handleLessonClick}
          isCollapsed={isLmsSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentItemType === 'quiz' && currentQuiz ? (
          /* Quiz Player */
          <QuizPlayer
            quiz={currentQuiz}
            userId={userId}
            onComplete={handleQuizComplete}
          />
        ) : scormUrl ? (
          <>


            {/* SCORM Player - Full Height */}
            <div className="flex-1 overflow-hidden -mt-12 relative">
              {/* Loading Overlay */}
              {iframeLoading && (
                <div className={`absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-luna-primary-50/95 to-white/95 backdrop-blur-sm transition-opacity duration-1000 ease-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                  <div className="max-w-md mx-auto px-6 py-8 bg-white rounded-2xl shadow-xl border border-luna-border-default">
                    <div className="flex flex-col items-center text-center space-y-6">
                      {/* Title */}
                      <div>
                        <h3 className="text-xl font-semibold text-luna-gray-900 mb-2">
                          Loading Your Content
                        </h3>
                        <p className="text-sm text-luna-gray-600 leading-relaxed">
                          Your lesson is loading with rich multimedia, interactive elements, and styling.
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full space-y-3">
                        <div className="w-full bg-luna-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-luna-primary-500 to-luna-primary-600 transition-all duration-500 ease-out rounded-full"
                            style={{ width: `${loadingProgress}%` }}
                          >
                            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                        <p className="text-sm font-semibold text-luna-primary-700">
                          {loadingProgress}% Complete
                        </p>
                      </div>

                      {/* Info Box */}
                      <div className="w-full bg-luna-primary-50 border border-luna-primary-200 rounded-lg p-4">
                        <p className="text-sm text-luna-gray-700 leading-relaxed">
                          <span className="font-semibold text-luna-primary-700">Please wait:</span> Complex lessons with quizzes and media may take up to <span className="font-semibold">2 minutes</span> to fully load.
                        </p>
                      </div>

                      {/* Thank You Message */}
                      <p className="text-sm text-luna-gray-500 italic">
                        Thank you for your patience! 🎓
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {iframeError && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-red-50">
                  <div className="max-w-md mx-auto px-6 py-8 bg-white rounded-2xl shadow-xl border border-red-200">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-3xl">⚠️</span>
                      </div>
                      <h3 className="text-xl font-semibold text-red-900">
                        Content Failed to Load
                      </h3>
                      <p className="text-sm text-red-700">
                        There was an error loading this lesson. Please refresh the page or contact support if the issue persists.
                      </p>
                      <LunaButton
                        onClick={() => window.location.reload()}
                        variant="primary"
                      >
                        Refresh Page
                      </LunaButton>
                    </div>
                  </div>
                </div>
              )}

              <iframe
                ref={iframeRef}
                src={scormUrl}
                className={`w-full border-0 transition-opacity duration-1000 ease-out ${iframeLoading ? 'opacity-0' : 'opacity-100'}`}
                style={{ height: 'calc(100% + 3rem)' }}
                title={currentLesson?.title || 'Lesson Content'}
                allow="fullscreen"
                loading="eager"
              />
            </div>

            {/* Sticky Footer - Fixed at Bottom (only for lessons) */}
            {currentLesson && (
              <div className="bg-white border-t border-luna-border-default shadow-lg">
                <div className="px-6 py-3 flex items-center justify-between gap-4">
                  {/* Left: Lesson Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-luna-gray-900 truncate">
                        {currentLesson.title}
                      </h3>
                      {currentLesson.description && (
                        <button
                          onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
                          className="shrink-0 p-1 hover:bg-luna-gray-100 rounded transition-colors"
                          aria-label={isDescriptionOpen ? 'Hide description' : 'Show description'}
                        >
                          {isDescriptionOpen ? (
                            <ChevronUp className="w-4 h-4 text-luna-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-luna-gray-600" />
                          )}
                        </button>
                      )}
                    </div>
                    {isDescriptionOpen && currentLesson.description && (
                      <p className="text-sm text-luna-gray-600 mt-2">{currentLesson.description}</p>
                    )}
                  </div>

                  {/* Right: Complete Button or Completed badge */}
                  <div className="shrink-0 flex items-center gap-4">
                    {/* Show Mark Complete button or Completed badge */}
                    {isCompleted ? (
                      <div className="flex items-center gap-2 text-green-600 px-4 py-2 bg-green-50 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold text-base">Completed</span>
                      </div>
                    ) : (
                      <LunaButton
                        onClick={handleMarkComplete}
                        loading={completing}
                        disabled={completing || !scormCompleted}
                        size="md"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark Complete
                      </LunaButton>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg border border-luna-border-default p-8 text-center">
              <p className="text-lg text-luna-gray-900">No SCORM content available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



