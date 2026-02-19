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

type Course = Database['public']['Tables']['courses']['Row'];
type Lesson = Database['public']['Tables']['lessons']['Row'];

interface CourseLearnClientProps {
  course: any;
  currentLesson: Lesson | null;
  currentQuiz: any | null;
  currentItemType?: 'lesson' | 'quiz';
  currentModuleId: string;
  scormUrl: string;
  lessonProgress: any[];
  quizAttempts: any[];
  moduleProgress: any[];
  courseProgress: any;
  userId: string;
}

export function CourseLearnClient({
  course,
  currentLesson,
  currentQuiz,
  currentItemType,
  currentModuleId,
  scormUrl,
  lessonProgress,
  quizAttempts,
  moduleProgress,
  courseProgress,
  userId,
}: CourseLearnClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [scormCompleted, setScormCompleted] = useState(false); // SCORM content completed (enables button)
  const [scormData, setScormData] = useState<ScormData | null>(null); // SCORM data captured from content
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

  // Build modules data for sidebar with locked states
  const modules: LMSModule[] = (course.course_modules || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .filter((courseModule: any) => courseModule.modules) // Filter out null modules
    .map((courseModule: any, moduleIndex: number) => {
      const mod = courseModule.modules;

      // Check if module is unlocked (first module is always unlocked)
      let isUnlocked = moduleIndex === 0;
      if (moduleIndex > 0) {
        // Check if previous module is completed
        const sortedModules = (course.course_modules || [])
          .filter((cm: any) => cm.modules)
          .sort((a: any, b: any) => a.sort_order - b.sort_order);
        const previousModule = sortedModules[moduleIndex - 1]?.modules;
        if (previousModule) {
          const previousModuleProgress = moduleProgress.find((mp: any) => mp.module_id === previousModule.id);
          isUnlocked = previousModuleProgress?.status === 'completed';
        }
      }

      // Combine lessons and quizzes into a single array
      const lessonItems = (mod.module_lessons || [])
        .filter((ml: any) => ml.lessons)
        .map((ml: any) => ({ type: 'lesson' as const, data: ml, sort_order: ml.sort_order }));

      const quizItems = (mod.module_quizzes || [])
        .filter((mq: any) => mq.quizzes)
        .map((mq: any) => ({ type: 'quiz' as const, data: mq, sort_order: mq.sort_order }));

      const allItems = [...lessonItems, ...quizItems].sort((a, b) => a.sort_order - b.sort_order);

      const lessons: LMSLesson[] = allItems.map((item, itemIndex) => {
        // Check if item is unlocked (first item is always unlocked, or if previous item is completed)
        let isItemUnlocked = itemIndex === 0;
        if (itemIndex > 0 && isUnlocked) { // Only check if module itself is unlocked
          const previousItem = allItems[itemIndex - 1];
          if (previousItem.type === 'lesson') {
            const previousLesson = previousItem.data.lessons;
            const previousLessonProgress = lessonProgress.find((p: any) => p.lesson_id === previousLesson.id);
            isItemUnlocked = previousLessonProgress?.status === 'completed' || previousLessonProgress?.status === 'passed';
          } else {
            const previousQuiz = previousItem.data.quizzes;
            const attempts = quizAttempts.filter((qa: any) => qa.quiz_id === previousQuiz.id);
            const latestAttempt = attempts[0];
            isItemUnlocked = latestAttempt?.completed_at != null;
          }
        }

        if (item.type === 'lesson') {
          const moduleLesson = item.data;
          const lesson = moduleLesson.lessons;
          const progress = lessonProgress.find((p: any) => p.lesson_id === lesson.id);
          const completed = progress?.status === 'completed' || progress?.status === 'passed';

          return {
            id: lesson.id,
            title: lesson.title,
            duration_minutes: lesson.duration_minutes,
            is_required: moduleLesson.is_required,
            sort_order: moduleLesson.sort_order,
            completed,
            locked: !isItemUnlocked,
            type: 'lesson' as const,
            quiz_score: progress?.score_raw || null,
          };
        } else {
          const moduleQuiz = item.data;
          const quiz = moduleQuiz.quizzes;
          const attempts = quizAttempts.filter((qa: any) => qa.quiz_id === quiz.id);
          const latestAttempt = attempts[0]; // Already sorted by started_at desc
          const completed = latestAttempt?.completed_at != null;

          return {
            id: quiz.id,
            title: quiz.name,
            duration_minutes: quiz.duration_minutes,
            is_required: moduleQuiz.is_required,
            sort_order: moduleQuiz.sort_order,
            completed,
            locked: !isItemUnlocked,
            type: 'quiz' as const,
            quiz_score: latestAttempt?.percentage || null,
            number_of_questions: quiz.number_of_questions,
          };
        }
      });

      return {
        id: mod.id,
        title: mod.title,
        lessons,
        sort_order: courseModule.sort_order,
        locked: !isUnlocked,
      };
    });

  // Calculate completion percentage
  const totalLessons = modules.reduce((sum, mod) => sum + mod.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, mod) => sum + mod.lessons.filter(l => l.completed).length,
    0
  );
  const completionPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Update completion status when lesson changes
  useEffect(() => {
    if (currentLesson) {
      const progress = lessonProgress.find((p: any) => p.lesson_id === currentLesson.id);
      setIsCompleted(progress?.status === 'completed' || progress?.status === 'passed');
    }
  }, [currentLesson?.id, lessonProgress]);

  // Find current item index for navigation
  let currentLessonIndex = -1;
  let allLessons: Array<{ lessonId: string; moduleId: string; type?: 'lesson' | 'quiz' }> = [];

  modules.forEach(mod => {
    mod.lessons.forEach(lesson => {
      allLessons.push({ lessonId: lesson.id, moduleId: mod.id, type: lesson.type });
    });
  });

  if (currentLesson) {
    currentLessonIndex = allLessons.findIndex(l => l.lessonId === currentLesson.id);
  } else if (currentQuiz) {
    currentLessonIndex = allLessons.findIndex(l => l.lessonId === currentQuiz.id);
  }

  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null;
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null;

  const handleLessonClick = (itemId: string, moduleId: string) => {
    // Determine if this is a lesson or quiz
    const item = allLessons.find(l => l.lessonId === itemId);
    if (!item) return;

    if (item.type === 'quiz') {
      router.push(`/u/learning/courses/${course.id}/learn?quiz=${itemId}&module=${moduleId}`);
    } else {
      router.push(`/u/learning/courses/${course.id}/learn?lesson=${itemId}&module=${moduleId}`);
    }
  };

  const handlePrevious = () => {
    if (previousLesson) {
      handleLessonClick(previousLesson.lessonId, previousLesson.moduleId);
    }
  };

  const handleNext = () => {
    if (nextLesson) {
      handleLessonClick(nextLesson.lessonId, nextLesson.moduleId);
    }
  };

  const handleMarkComplete = async () => {
    if (!currentLesson || !userId) {
      return;
    }

    setCompleting(true);
    try {
      // Get session for authentication
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('No session found');
        setCompleting(false);
        return;
      }

      const requestBody = {
        lesson_id: currentLesson.id,
        module_id: currentModuleId,
        completed: true,
        progress_percentage: 100,
        // Include SCORM data if available
        ...(scormData && {
          score: scormData.score_raw,
          score_min: scormData.score_min,
          score_max: scormData.score_max,
          passing_score: scormData.passing_score,
          success_status: scormData.success_status,
          scorm_cmi_data: scormData.cmi_data,
        }),
      };
      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        setIsCompleted(true);
        router.refresh();
      } else {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('API error data:', errorData);
        } catch (e) {
          console.error('Could not parse error as JSON');
        }
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setCompleting(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/u/learning');
  };

  // Get current module title
  const currentModule = modules.find(m => m.id === currentModuleId);
  const currentLessonData = currentModule?.lessons.find(l => l.id === currentLesson?.id);
  const lessonNumber = currentModule?.lessons.findIndex(l => l.id === currentLesson?.id);

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
            courseTitle={course.title}
            modules={modules}
            currentLessonId={currentLesson?.id}
            completionPercentage={completionPercentage}
            onLessonClick={handleLessonClick}
            isCollapsed={isLmsSidebarCollapsed}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentItemType === 'quiz' && currentQuiz ? (
            <div className="flex-1 overflow-auto">
              <QuizPlayer
                quiz={currentQuiz}
                userId={userId}
                onComplete={() => router.refresh()}
              />
            </div>
          ) : currentLesson && scormUrl ? (
            <>
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

              {/* SCORM API Adapter - Enhances the API with completion detection logic */}
              <ScormApiAdapter
                lessonId={currentLesson.id}
                userId={userId}
                moduleId={currentModuleId}
                onScormComplete={(data) => {
                  setScormCompleted(true);
                  setScormData(data);
                }}
                onProgressUpdate={() => {}}
              />

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
                title={currentLesson.title}
                allow="fullscreen"
                loading="eager"
              />
            </div>

            {/* Sticky Footer - Fixed at Bottom */}
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

                {/* Right: Complete Button or Completed Badge */}
                <div className="shrink-0">
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
          </>
        ) : currentLesson ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg border border-luna-border-default p-8 text-center">
              <p className="text-luna-gray-600">No SCORM content available for this lesson.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg border border-luna-border-default p-8 text-center">
              <p className="text-luna-gray-600">Please select a lesson or quiz from the sidebar to begin.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

