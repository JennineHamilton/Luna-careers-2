'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LunaSectionLabelProps {
  /** Section label text */
  label: string;
  /** Additional className */
  className?: string;
}

/**
 * LunaSectionLabel - Component for displaying section labels with inline separator line.
 * Used for section headings like "Languages", "Skills", "Professional Experience", etc.
 *
 * @example
 * ```tsx
 * <LunaSectionLabel label="Languages" />
 * <LunaSectionLabel label="Professional Experience" />
 * ```
 */
export function LunaSectionLabel({
  label,
  className,
}: LunaSectionLabelProps) {
  return (
    <div
      data-slot="luna-section-label"
      className={cn('flex items-center gap-4 mb-4', className)}
    >
      <h3 className="text-sm font-semibold text-luna-gray-900 whitespace-nowrap">
        {label}
      </h3>
      <div className="flex-1 border-t border-luna-border-default"></div>
    </div>
  );
}

