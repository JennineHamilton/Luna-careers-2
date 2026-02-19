'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LunaCard, LunaCardContent, LunaCardFooter, LunaCardHeader } from './card';

export interface LunaImageCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  imageSrc: string;
  /** Image alt text */
  imageAlt: string;
  /** Card title */
  title?: string;
  /** Card description */
  description?: string;
  /** Badge/tag to display on the image */
  badge?: React.ReactNode;
  /** Footer content */
  footer?: React.ReactNode;
  /** Image aspect ratio */
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide';
  /** Image object fit */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Whether the card is clickable */
  clickable?: boolean;
  /** Click handler */
  onClick?: () => void;
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
};

/**
 * LunaImageCard - A card component with an image header.
 *
 * @example
 * ```tsx
 * <LunaImageCard
 *   imageSrc="/course-thumbnail.jpg"
 *   imageAlt="Course thumbnail"
 *   title="Introduction to React"
 *   description="Learn the basics of React development"
 *   badge={<LunaBadge>New</LunaBadge>}
 *   footer={<LunaButton>Enroll Now</LunaButton>}
 * />
 * ```
 */
export function LunaImageCard({
  imageSrc,
  imageAlt,
  title,
  description,
  badge,
  footer,
  aspectRatio = 'video',
  objectFit = 'cover',
  clickable = false,
  onClick,
  className,
  ...props
}: LunaImageCardProps) {
  return (
    <LunaCard
      data-slot="luna-image-card"
      className={cn(
        'overflow-hidden',
        clickable && 'cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Image Header */}
      <div className={cn('relative w-full overflow-hidden bg-luna-gray-100', aspectRatioClasses[aspectRatio])}>
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className={cn('object-cover', objectFit === 'contain' && 'object-contain', objectFit === 'fill' && 'object-fill')}
        />
        {badge && (
          <div className="absolute top-3 right-3 z-10">
            {badge}
          </div>
        )}
      </div>

      {/* Content */}
      {(title || description) && (
        <LunaCardContent className="p-4">
          {title && (
            <h3 className="text-lg font-semibold text-luna-gray-900 mb-2 line-clamp-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-luna-gray-600 line-clamp-3">
              {description}
            </p>
          )}
        </LunaCardContent>
      )}

      {/* Footer */}
      {footer && (
        <LunaCardFooter className="p-4 pt-0">
          {footer}
        </LunaCardFooter>
      )}
    </LunaCard>
  );
}

