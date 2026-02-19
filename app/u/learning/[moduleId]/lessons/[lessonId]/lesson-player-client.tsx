'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LunaCard,
  LunaCardHeader,
  LunaCardTitle,
  LunaCardContent,
  LunaButton,
  LunaBadge,
} from '@/components/luna';
import { LunaSCORMPlayer } from '@/components/luna/learning/scorm-player';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Module = Database['public']['Tables']['modules']['Row'];

interface LessonPlayerClientProps {
  lesson: Lesson;
  module: Module;
  scormUrl: string;
  lessonProgress: any;
  userId: string;
  moduleId: string;
  previousLesson: any;
  nextLesson: any;
}

export function LessonPlayerClient({
  lesson,
  module,
  scormUrl,
  lessonProgress,
  userId,
  moduleId,
  previousLesson,
  nextLesson,
}: LessonPlayerClientProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(lessonProgress?.completed || false);

  const handleComplete = () => {
    setIsCompleted(true);
    router.refresh();
  };

  const handlePrevious = () => {
    if (previousLesson) {
      router.push(`/u/learning/${moduleId}/lessons/${previousLesson.lesson_id}`);
    }
  };

  const handleNext = () => {
    if (nextLesson) {
      router.push(`/u/learning/${moduleId}/lessons/${nextLesson.lesson_id}`);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="min-h-screen bg-luna-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <LunaButton
            variant="ghost"
            onClick={() => router.push(`/u/learning/${moduleId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Module
          </LunaButton>

          <div className="flex items-center gap-2">
            <LunaButton
              variant="secondary"
              onClick={handlePrevious}
              disabled={!previousLesson}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </LunaButton>
            <LunaButton
              variant="secondary"
              onClick={handleNext}
              disabled={!nextLesson}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </LunaButton>
          </div>
        </div>

        {/* Module Context */}
        <div className="bg-white border border-luna-border-light rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-luna-gray-600">
            <BookOpen className="w-4 h-4" />
            <span>{module.title}</span>
            <span className="text-luna-gray-400">/</span>
            <span className="text-luna-gray-900 font-medium">{lesson.title}</span>
          </div>
        </div>

        {/* Lesson Info */}
        <LunaCard>
          <LunaCardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <LunaCardTitle className="text-2xl mb-2">{lesson.title}</LunaCardTitle>
                {lesson.description && (
                  <p className="text-luna-gray-600">{lesson.description}</p>
                )}
              </div>
              {isCompleted && (
                <LunaBadge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </LunaBadge>
              )}
            </div>
          </LunaCardHeader>
          <LunaCardContent>
            <div className="flex items-center gap-4 text-sm text-luna-gray-600">
              {lesson.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatDuration(lesson.duration_minutes)}</span>
                </div>
              )}
            </div>
          </LunaCardContent>
        </LunaCard>

        {/* SCORM Player */}
        {scormUrl ? (
          <LunaSCORMPlayer
            src={scormUrl}
            title={lesson.title}
            lessonId={lesson.id}
            userId={userId}
            moduleId={moduleId}
            isCompleted={isCompleted}
            onComplete={handleComplete}
          />
        ) : (
          <LunaCard>
            <LunaCardContent className="text-center py-12">
              <p className="text-luna-gray-600">No SCORM content available for this lesson.</p>
            </LunaCardContent>
          </LunaCard>
        )}
      </div>
    </div>
  );
}

