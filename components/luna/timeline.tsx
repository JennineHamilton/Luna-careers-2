'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  /** Item title */
  title: string;
  /** Item description */
  description?: string;
  /** Item date/time */
  date?: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Item status */
  status?: 'default' | 'success' | 'error' | 'warning';
}

export interface LunaTimelineProps {
  /** Array of timeline items */
  items: TimelineItem[];
  /** Additional className */
  className?: string;
}

/**
 * LunaTimeline - Timeline component for chronological events.
 *
 * @example
 * ```tsx
 * <LunaTimeline
 *   items={[
 *     { title: 'Started Position', description: 'Software Engineer at Tech Co', date: '2023-01', status: 'success' },
 *     { title: 'Promoted', description: 'Senior Software Engineer', date: '2024-06', status: 'success' }
 *   ]}
 * />
 * ```
 */
export function LunaTimeline({ items, className }: LunaTimelineProps) {
  const statusColors = {
    default: 'bg-luna-gray-300',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
  };

  return (
    <div data-slot="luna-timeline" className={cn('relative', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const status = item.status || 'default';

        return (
          <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Timeline Line */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-luna-gray-200" />
            )}

            {/* Timeline Dot */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shadow-sm',
                  statusColors[status]
                )}
              >
                {item.icon && (
                  <div className="text-white w-4 h-4 flex items-center justify-center">
                    {item.icon}
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-luna-gray-900">{item.title}</h4>
                  {item.description && (
                    <p className="text-sm text-luna-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                {item.date && (
                  <span className="text-xs text-luna-gray-450 whitespace-nowrap">{item.date}</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

