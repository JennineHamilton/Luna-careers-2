'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight, CheckCircle, Circle, FileText, ArrowLeft, Lock, Video, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from '@/components/luna/button';

export interface LMSContentItem {
  id: string;
  title: string;
  duration_minutes: number;
  is_required: boolean;
  sort_order: number;
  completed: boolean;
  locked?: boolean;
  type: 'lesson' | 'quiz'; // Type of content
  quiz_score?: number | null; // Quiz score (0-100) for quizzes
  number_of_questions?: number; // Number of questions for quizzes
}

// Keep LMSLesson for backward compatibility
export type LMSLesson = LMSContentItem;

export interface LMSModule {
  id: string;
  title: string;
  lessons: LMSContentItem[]; // Now supports both lessons and quizzes
  sort_order: number;
  locked?: boolean;
}

export interface LMSSidebarProps {
  courseTitle: string;
  modules: LMSModule[];
  currentLessonId?: string;
  completionPercentage: number;
  onLessonClick: (lessonId: string, moduleId: string) => void;
  onBackClick?: () => void;
  className?: string;
  isCollapsed?: boolean;
}

/**
 * LMSSidebar - Sidebar navigation for LMS course player
 * Displays course info, modules, and lessons with completion tracking
 */
export function LMSSidebar({
  courseTitle,
  modules,
  currentLessonId,
  completionPercentage,
  onLessonClick,
  onBackClick,
  className,
  isCollapsed = false,
}: LMSSidebarProps) {
  const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
    new Set(modules.map(m => m.id))
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  // Find current lesson for collapsed view
  const currentLessonInfo = React.useMemo(() => {
    for (const module of modules) {
      const lessonIndex = module.lessons.findIndex(l => l.id === currentLessonId);
      if (lessonIndex !== -1) {
        return {
          lesson: module.lessons[lessonIndex],
          lessonNumber: lessonIndex + 1,
          totalLessons: module.lessons.length,
        };
      }
    }
    return null;
  }, [modules, currentLessonId]);

  // Collapsed view
  if (isCollapsed) {
    return (
      <div
        data-slot="lms-sidebar-collapsed"
        className={cn(
          'h-full flex flex-col bg-white overflow-hidden items-center py-4',
          className
        )}
      >
        {/* Progress Circle */}
        <div className="relative w-12 h-12 mb-4">
          <svg className="w-12 h-12 transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-luna-gray-200"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - completionPercentage / 100)}`}
              className="text-luna-primary transition-all duration-300"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-luna-gray-900">{completionPercentage}%</span>
          </div>
        </div>

        {/* Current Lesson Indicator */}
        {currentLessonInfo && (
          <div className="flex flex-col items-center gap-2 px-2">
            <div className="w-10 h-10 rounded-full bg-luna-primary/10 flex items-center justify-center">
              {currentLessonInfo.lesson.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-luna-primary" />
              )}
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-luna-gray-900">
                {currentLessonInfo.lessonNumber}/{currentLessonInfo.totalLessons}
              </div>
              <div className="text-[10px] text-luna-gray-500">Lessons</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Expanded view
  return (
    <div
      data-slot="lms-sidebar"
      className={cn(
        'h-full flex flex-col bg-white overflow-hidden',
        className
      )}
    >
      {/* Back Button */}
      {onBackClick && (
        <div className="px-3 py-2 border-b border-luna-border-default">
          <LunaButton
            variant="ghost"
            size="sm"
            onClick={onBackClick}
            className="w-full justify-start text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
            Back to Dashboard
          </LunaButton>
        </div>
      )}

      {/* Course Header - Compact */}
      <div className="px-4 py-4 border-b border-luna-border-default bg-gradient-to-r from-luna-primary/5 to-luna-blue/5">
        <h2 className="font-bold text-luna-gray-900 text-base mb-2 line-clamp-2">
          {courseTitle}
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-luna-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-luna-primary to-luna-blue transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-luna-gray-700 tabular-nums">
            {completionPercentage}%
          </span>
        </div>
      </div>

      {/* Modules & Lessons List - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.id);
            const completedLessons = module.lessons.filter(l => l.completed).length;
            const totalLessons = module.lessons.length;
            const moduleComplete = completedLessons === totalLessons;
            const isLocked = module.locked || false;

            return (
              <div key={module.id} className="mb-1">
                {/* Module Header */}
                <button
                  onClick={() => !isLocked && toggleModule(module.id)}
                  disabled={isLocked}
                  className={cn(
                    "w-full flex items-start gap-2.5 p-3 rounded-md transition-colors text-left group",
                    isLocked
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-luna-gray-50"
                  )}
                  title={isLocked ? "Complete previous module to unlock" : undefined}
                >
                  <div className="mt-0.5">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-luna-gray-400" />
                    ) : isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-luna-gray-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-luna-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-semibold text-sm mb-1 transition-colors",
                      isLocked
                        ? "text-luna-gray-500"
                        : "text-luna-gray-900 group-hover:text-luna-primary"
                    )}>
                      {module.title}
                    </div>
                    <div className="text-xs text-luna-gray-500">
                      {isLocked ? "🔒 Locked" : `${completedLessons}/${totalLessons} lessons`}
                    </div>
                  </div>
                  {moduleComplete && !isLocked && (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  )}
                </button>

                {/* Content Items (Lessons & Quizzes) */}
                {isExpanded && !isLocked && (
                  <div className="ml-6 mt-1 space-y-1">
                    {module.lessons.map((item, itemIndex) => {
                      const isCurrentItem = item.id === currentLessonId;
                      const isItemLocked = item.locked || false;
                      const isQuiz = item.type === 'quiz';

                      return (
                        <button
                          key={item.id}
                          onClick={() => !isItemLocked && onLessonClick(item.id, module.id)}
                          disabled={isItemLocked}
                          className={cn(
                            'w-full flex items-start gap-2.5 p-2.5 rounded-md transition-all text-left',
                            isItemLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : isCurrentItem
                              ? isQuiz
                                ? 'bg-purple-50 border border-purple-200 shadow-sm'
                                : 'bg-luna-primary/10 border border-luna-primary/30 shadow-sm'
                              : 'hover:bg-luna-gray-50 border border-transparent'
                          )}
                          title={isItemLocked ? "Complete previous item to unlock" : undefined}
                        >
                          <div className="mt-0.5">
                            {isItemLocked ? (
                              <Lock className="w-4 h-4 text-luna-gray-400" />
                            ) : item.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : isQuiz ? (
                              <ClipboardList className="w-4 h-4 text-purple-500" />
                            ) : (
                              <Video className="w-4 h-4 text-luna-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                'text-sm mb-1 truncate',
                                isItemLocked
                                  ? 'text-luna-gray-500'
                                  : isCurrentItem
                                  ? isQuiz
                                    ? 'font-semibold text-purple-700'
                                    : 'font-semibold text-luna-primary'
                                  : 'font-medium text-luna-gray-900'
                              )}
                            >
                              {item.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-luna-gray-500">
                              {isQuiz ? (
                                <>
                                  <span>{item.number_of_questions || 0} questions</span>
                                  <span>•</span>
                                  <span>{item.duration_minutes} min</span>
                                  {item.quiz_score !== null && item.quiz_score !== undefined && (
                                    <>
                                      <span>•</span>
                                      <span className="font-semibold text-green-600">
                                        Score: {Math.round(item.quiz_score)}%
                                      </span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <span>{item.duration_minutes} min</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

