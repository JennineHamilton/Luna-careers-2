'use client';

import * as React from 'react';
import { Maximize, Minimize, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from '@/components/luna/button';

export interface LunaSCORMPlayerProps {
  /** SCORM package URL */
  src: string;
  /** Lesson title */
  title?: string;
  /** Lesson ID for progress tracking */
  lessonId: string;
  /** User ID */
  userId: string;
  /** Module ID */
  moduleId: string;
  /** Is lesson completed */
  isCompleted?: boolean;
  /** Callback when lesson is marked complete */
  onComplete?: () => void;
  /** Additional className */
  className?: string;
}

/**
 * LunaSCORMPlayer - SCORM content player with progress tracking.
 *
 * @example
 * ```tsx
 * <LunaSCORMPlayer
 *   src="https://storage.supabase.co/scorm-packages/lesson.zip"
 *   title="Introduction to React"
 *   lessonId="123"
 *   userId="456"
 *   moduleId="789"
 * />
 * ```
 */
export function LunaSCORMPlayer({
  src,
  title,
  lessonId,
  userId,
  moduleId,
  isCompleted = false,
  onComplete,
  className,
}: LunaSCORMPlayerProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [completing, setCompleting] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const response = await fetch('/api/learning/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          module_id: moduleId,
          user_id: userId,
          completed: true,
          progress_percentage: 100,
        }),
      });

      if (response.ok) {
        onComplete?.();
      }
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setCompleting(false);
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      data-slot="luna-scorm-player"
      className={cn('relative bg-white rounded-lg overflow-hidden border border-luna-border-light', className)}
    >
      {title && (
        <div className="bg-luna-gray-50 border-b border-luna-border-light p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-luna-gray-900">{title}</h3>
            <div className="flex items-center gap-2">
              {isCompleted && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Completed</span>
                </div>
              )}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-luna-gray-100 rounded-lg transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-[600px] border-0"
        title={title || 'SCORM Content'}
        allow="fullscreen"
      />

      {!isCompleted && (
        <div className="bg-luna-gray-50 border-t border-luna-border-light p-4">
          <LunaButton
            onClick={handleMarkComplete}
            loading={completing}
            disabled={completing}
            className="w-full sm:w-auto"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Complete
          </LunaButton>
        </div>
      )}
    </div>
  );
}

