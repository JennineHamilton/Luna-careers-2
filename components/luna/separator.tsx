'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LunaSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator */
  orientation?: 'horizontal' | 'vertical';
  /** Whether the separator is decorative (for accessibility) */
  decorative?: boolean;
}

/**
 * LunaSeparator - A visual separator line component.
 *
 * @example
 * ```tsx
 * <LunaSeparator />
 * <LunaSeparator orientation="vertical" className="h-20" />
 * ```
 */
export function LunaSeparator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: LunaSeparatorProps) {
  return (
    <div
      data-slot="luna-separator"
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        'shrink-0 bg-luna-border-default',
        orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
        className
      )}
      {...props}
    />
  );
}

