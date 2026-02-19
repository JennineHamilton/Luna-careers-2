'use client';

/**
 * Content Card Component
 * Displays program, course, or module information in a card format
 * Used in catalog views and enrollment dashboards
 */

import { LunaCard, LunaBadge, LunaProgress, LunaButton } from '@/components/luna';
import { BookOpen, Clock, Award, DollarSign, ClipboardList, Coins } from 'lucide-react';
import Image from 'next/image';
import { formatDollars } from '@/lib/utils/credit-conversion';

export interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  coverImage?: string | null;
  level?: 'beginner' | 'intermediate' | 'advanced' | null;
  duration?: number | null; // in minutes
  price?: number; // Price in dollars
  isFree?: boolean;
  progress?: number; // 0-100 for enrolled content
  isEnrolled?: boolean;
  isPublished?: boolean;
  hasPendingScholarship?: boolean;
  scholarshipEligible?: boolean; // Whether scholarship is available
  creditBalance?: number; // User's available credits
  creatorName?: string;
  creatorLogo?: string | null;
  contentType?: 'module' | 'course' | 'program'; // Type of learning content
  itemCount?: number; // Number of lessons/modules/courses
  lessonCount?: number; // Number of lessons (for modules)
  quizCount?: number; // Number of quizzes (for modules)
  skills?: string[]; // Skills you'll learn
  tags?: string[]; // Tags/categories for the content
  onEnroll?: () => void;
  onContinue?: () => void;
  onView?: () => void;
  onClick?: () => void; // Make card clickable
}

export function ContentCard({
  id,
  title,
  description,
  coverImage,
  level,
  duration,
  price = 0,
  isFree = false,
  progress,
  isEnrolled = false,
  isPublished = true,
  hasPendingScholarship = false,
  scholarshipEligible = false,
  creditBalance,
  creatorName,
  creatorLogo,
  contentType = 'course',
  itemCount,
  lessonCount,
  quizCount,
  skills = [],
  tags = [],
  onEnroll,
  onContinue,
  onView,
  onClick,
}: ContentCardProps) {
  const levelColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getContentTypeLabel = () => {
    if (contentType === 'program') return 'Specialization';
    if (contentType === 'course') return 'Course';
    return 'Module';
  };

  const getItemCountLabel = () => {
    if (!itemCount) return null;
    if (contentType === 'program') return `${itemCount} courses`;
    if (contentType === 'course') return `${itemCount} modules`;
    return `${itemCount} lessons`;
  };

  return (
    <LunaCard
      padding="none"
      className="p-2.5 border border-luna-border-default rounded-md shadow-luna-sm hover:shadow-luna-md transition-all duration-300 cursor-pointer h-[420px] flex flex-col"
      onClick={onClick}
    >
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md overflow-hidden">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
        )}

      </div>

      {/* Content */}
      <div className="space-y-3 pt-3 flex-1 flex flex-col">
        {/* Creator Info */}
        {creatorName && (
          <div className="flex items-center gap-2">
            {creatorLogo && (
              <Image
                src={creatorLogo}
                alt={creatorName}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">{creatorName}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-bold text-lg line-clamp-2 text-luna-gray-900">{title}</h3>

        {/* Skills you'll learn - truncated with ellipsis */}
        {skills.length > 0 && (
          <p className="text-sm leading-relaxed line-clamp-2">
            <span className="font-bold text-luna-gray-900">Skills you'll gain: </span>
            <span className="text-gray-600 dark:text-gray-400">{skills.slice(0, 4).join(', ')}</span>
          </p>
        )}

        {/* Status Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isPublished && (
            <LunaBadge variant="default">
              Draft
            </LunaBadge>
          )}
          {isEnrolled && (
            <LunaBadge variant="success">
              Enrolled
            </LunaBadge>
          )}
          {!isEnrolled && hasPendingScholarship && (
            <LunaBadge variant="warning">
              Scholarship Pending
            </LunaBadge>
          )}
          {!isEnrolled && !hasPendingScholarship && isFree && (
            <LunaBadge variant="success">
              Free
            </LunaBadge>
          )}
        </div>

        {/* Progress Bar (for enrolled content) */}
        {isEnrolled && progress !== undefined && (
          <div className="space-y-1">
            <div className="w-full h-2 bg-luna-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 ease-in-out bg-green-500/30"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {progress}% complete
            </p>
          </div>
        )}

        {/* Item Count Row */}
        {contentType === 'module' && (lessonCount !== undefined || quizCount !== undefined) ? (
          <div className="flex items-center gap-3 text-sm text-luna-gray-700">
            {lessonCount !== undefined && lessonCount > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">{lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}</span>
              </div>
            )}
            {quizCount !== undefined && quizCount > 0 && (
              <div className="flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" />
                <span className="font-medium">{quizCount} {quizCount === 1 ? 'quiz' : 'quizzes'}</span>
              </div>
            )}
          </div>
        ) : itemCount ? (
          <div className="flex items-center gap-1.5 text-sm text-luna-gray-700">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">{getItemCountLabel()}</span>
          </div>
        ) : null}

        {/* Level & Type Row */}
        <div className="flex items-center gap-1 text-sm text-luna-gray-700">
          {level && (
            <span className="capitalize font-medium">{level}</span>
          )}
          {level && <span className="text-luna-gray-400">·</span>}
          <span className="font-medium">{getContentTypeLabel()}</span>
        </div>

        {/* Spacer to push actions to bottom */}
        <div className="flex-1" />

        {/* Actions with inline price */}
        <div className="pt-2 space-y-2">
          {isEnrolled ? (
            // Enrolled: Show Continue/Review button (and View Details if not completed)
            <>
              {progress === 100 ? (
                // Completed: Only show Review button
                <LunaButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onContinue?.();
                  }}
                  size="sm"
                  variant="primary"
                  className="w-full"
                >
                  Review
                </LunaButton>
              ) : (
                // In Progress: Show Continue Learning and View Details
                <div className="flex items-center justify-between gap-3">
                  <LunaButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onContinue?.();
                    }}
                    size="sm"
                    variant="primary"
                  >
                    Continue Learning
                  </LunaButton>
                  <LunaButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick?.();
                    }}
                    size="sm"
                    variant="outline"
                  >
                    View Details
                  </LunaButton>
                </div>
              )}
            </>
          ) : hasPendingScholarship ? (
            // Pending Scholarship: Show button and View Details
            <div className="flex items-center justify-between gap-3">
              <LunaButton
                onClick={(e) => {
                  e.stopPropagation();
                  onView?.();
                }}
                variant="outline"
                size="sm"
              >
                Scholarship Pending
              </LunaButton>
              <LunaButton
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
                size="sm"
                variant="outline"
              >
                View Details
              </LunaButton>
            </div>
          ) : (
            // Not Enrolled: Show scholarship badge, credits, price and View Details button
            <>
              {/* Scholarship Available Badge */}
              {scholarshipEligible && (
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900 font-semibold text-xs">Scholarship Available</span>
                </div>
              )}

              {/* Credits Display */}
              {creditBalance !== undefined && !isFree && price > 0 && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Your Balance:</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Coins className="w-3 h-3 text-yellow-600" />
                    {creditBalance.toLocaleString()} credits
                  </span>
                </div>
              )}

              {/* Price and View Details Button */}
              <div className="flex items-center justify-between gap-3">
                {/* Price */}
                <div className="flex items-center gap-1.5">
                  {!isFree && price > 0 ? (
                    <>
                      <DollarSign className="w-4 h-4 text-luna-gray-600" />
                      <span className="text-sm font-semibold text-luna-gray-900">${formatDollars(price)} BZD</span>
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 text-luna-gray-600" />
                      <span className="text-sm font-semibold text-luna-gray-900">Free</span>
                    </>
                  )}
                </div>

                {/* View Details Button */}
                <LunaButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                  size="sm"
                  variant="outline"
                >
                  View Details
                </LunaButton>
              </div>
            </>
          )}
        </div>
      </div>
    </LunaCard>
  );
}

