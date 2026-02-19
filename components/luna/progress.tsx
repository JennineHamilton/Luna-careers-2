'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LunaProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Progress bar size */
  size?: 'sm' | 'md' | 'lg';
  /** Progress bar variant */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Show percentage label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LunaProgress - Progress bar component.
 *
 * @example
 * ```tsx
 * <LunaProgress value={75} showLabel />
 * ```
 */
export function LunaProgress({
  value,
  size = 'md',
  variant = 'default',
  showLabel = false,
  className,
}: LunaProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const variantClasses = {
    default: 'bg-luna-blue',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div data-slot="luna-progress" className={cn('w-full', className)}>
      <div className={cn('w-full bg-luna-gray-100 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full transition-all duration-300 ease-in-out', variantClasses[variant])}
          style={{ width: `${clampedValue}%` }}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-xs text-luna-gray-600 text-right">{clampedValue}%</div>
      )}
    </div>
  );
}

