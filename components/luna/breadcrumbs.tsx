'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  /** Breadcrumb label */
  label: string;
  /** Breadcrumb href (optional for last item) */
  href?: string;
  /** Icon (optional) */
  icon?: React.ReactNode;
}

export interface LunaBreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Show home icon for first item */
  showHomeIcon?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LunaBreadcrumbs - Navigation breadcrumbs.
 *
 * @example
 * ```tsx
 * <LunaBreadcrumbs
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Courses', href: '/courses' },
 *     { label: 'Web Development' }
 *   ]}
 *   showHomeIcon
 * />
 * ```
 */
export function LunaBreadcrumbs({
  items,
  showHomeIcon = false,
  className,
}: LunaBreadcrumbsProps) {
  return (
    <nav
      data-slot="luna-breadcrumbs"
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-2 text-sm', className)}
    >
      <ol className="flex items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;

          return (
            <li key={index} className="flex items-center gap-2">
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 text-luna-gray-600 hover:text-luna-blue transition-colors',
                    isLast && 'text-luna-gray-900 font-medium pointer-events-none'
                  )}
                >
                  {isFirst && showHomeIcon && item.icon === undefined ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    item.icon
                  )}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-luna-gray-900 font-medium">
                  {isFirst && showHomeIcon && item.icon === undefined ? (
                    <Home className="w-4 h-4" />
                  ) : (
                    item.icon
                  )}
                  <span>{item.label}</span>
                </span>
              )}

              {!isLast && <ChevronRight className="w-4 h-4 text-luna-gray-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

