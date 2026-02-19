'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LunaSkeletonProps {
  /** Skeleton variant */
  variant?: 'text' | 'circular' | 'rectangular';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
  /** Additional className */
  className?: string;
}

/**
 * LunaSkeleton - Loading skeleton component.
 *
 * @example
 * ```tsx
 * <LunaSkeleton variant="text" width="100%" />
 * <LunaSkeleton variant="circular" width={40} height={40} />
 * <LunaSkeleton variant="rectangular" width="100%" height={200} />
 * ```
 */
export function LunaSkeleton({
  variant = 'rectangular',
  width,
  height,
  className,
}: LunaSkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      data-slot="luna-skeleton"
      className={cn(
        'animate-pulse bg-luna-gray-200',
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
}

/**
 * LunaSkeletonCard - Pre-built skeleton for card layouts.
 */
export function LunaSkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <LunaSkeleton variant="rectangular" width="100%" height={200} />
      <LunaSkeleton variant="text" width="60%" />
      <LunaSkeleton variant="text" width="80%" />
      <LunaSkeleton variant="text" width="40%" />
    </div>
  );
}

/**
 * LunaSkeletonAvatar - Pre-built skeleton for avatar + text.
 */
export function LunaSkeletonAvatar({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <LunaSkeleton variant="circular" width={40} height={40} />
      <div className="flex-1 space-y-2">
        <LunaSkeleton variant="text" width="60%" />
        <LunaSkeleton variant="text" width="40%" />
      </div>
    </div>
  );
}

/**
 * LunaSkeletonTable - Pre-built skeleton for table rows.
 */
export function LunaSkeletonTable({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <LunaSkeleton variant="text" width="20%" />
          <LunaSkeleton variant="text" width="30%" />
          <LunaSkeleton variant="text" width="25%" />
          <LunaSkeleton variant="text" width="15%" />
        </div>
      ))}
    </div>
  );
}

