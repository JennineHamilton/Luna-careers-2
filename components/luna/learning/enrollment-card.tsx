'use client';

/**
 * Enrollment Card Component
 * Displays user's enrolled content with progress tracking
 * Used in user dashboard and learning portal
 */

import { LunaCard, LunaBadge, LunaProgress, LunaButton } from '@/components/luna';
import { BookOpen, Calendar, Award, TrendingUp } from 'lucide-react';
import Image from 'next/image';

export interface EnrollmentCardProps {
  id: string;
  contentType: 'module' | 'course' | 'program';
  title: string;
  coverImage?: string | null;
  progress: number; // 0-100
  enrolledAt: string;
  lastAccessedAt?: string | null;
  completedAt?: string | null;
  certificateUrl?: string | null;
  onContinue: () => void;
  onViewCertificate?: () => void;
}

export function EnrollmentCard({
  id,
  contentType,
  title,
  coverImage,
  progress,
  enrolledAt,
  lastAccessedAt,
  completedAt,
  certificateUrl,
  onContinue,
  onViewCertificate,
}: EnrollmentCardProps) {
  const isCompleted = progress === 100 || !!completedAt;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return <LunaBadge variant="success">Completed</LunaBadge>;
    }
    if (progress > 0) {
      return <LunaBadge variant="warning">In Progress</LunaBadge>;
    }
    return <LunaBadge variant="default">Not Started</LunaBadge>;
  };

  return (
    <LunaCard className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Thumbnail */}
        <div className="relative w-full md:w-48 h-32 bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <BookOpen className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {contentType}
              </p>
              <h3 className="font-semibold text-lg mt-1">{title}</h3>
            </div>
            {getStatusBadge()}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <LunaProgress value={progress} className="h-2" />
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Enrolled {formatDate(enrolledAt)}</span>
            </div>
            {lastAccessedAt && !isCompleted && (
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                <span>Last accessed {formatDate(lastAccessedAt)}</span>
              </div>
            )}
            {completedAt && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Award className="w-4 h-4" />
                <span>Completed {formatDate(completedAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <LunaButton
              onClick={onContinue}
              variant={isCompleted ? 'outline' : 'primary'}
              className="flex-1"
            >
              {isCompleted ? 'Review Content' : 'Continue Learning'}
            </LunaButton>
            {isCompleted && certificateUrl && onViewCertificate && (
              <LunaButton
                onClick={onViewCertificate}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                View Certificate
              </LunaButton>
            )}
          </div>
        </div>
      </div>
    </LunaCard>
  );
}

