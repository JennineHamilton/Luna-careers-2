'use client';

import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaEmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Action button(s) */
  action?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Icon background color variant */
  iconBackground?: 'blue' | 'success' | 'warning' | 'error' | 'gray' | 'none';
  /** Show background container */
  showBackground?: boolean;
  /** Additional className */
  className?: string;
  /** onClick handler to make entire container clickable */
  onClick?: () => void;
}

const sizeConfig = {
  sm: {
    container: 'py-6',
    containerWithBg: 'p-6',
    icon: 'w-12 h-12',
    iconContainer: 'w-12 h-12',
    title: 'text-sm font-medium leading-[1.2]',
    description: 'text-[11px] leading-[1.2]',
  },
  md: {
    container: 'py-12',
    containerWithBg: 'p-6',
    icon: 'w-16 h-16',
    iconContainer: 'w-[50px] h-[50px]',
    title: 'text-sm font-medium leading-[1.2]',
    description: 'text-[11px] leading-[1.2]',
  },
  lg: {
    container: 'py-16',
    containerWithBg: 'p-6',
    icon: 'w-20 h-20',
    iconContainer: 'w-16 h-16',
    title: 'text-sm font-medium leading-[1.2]',
    description: 'text-[11px] leading-[1.2]',
  },
};

const iconBackgroundConfig = {
  blue: 'bg-luna-info/15 text-luna-info',
  success: 'bg-luna-success/15 text-luna-success',
  warning: 'bg-luna-warning/15 text-luna-warning',
  error: 'bg-luna-error/15 text-luna-error',
  gray: 'bg-luna-gray-200 text-luna-gray-600',
  none: 'text-luna-gray-400',
};

/**
 * LunaEmptyState - Component for displaying empty states in lists and tables.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LunaEmptyState
 *   icon={Inbox}
 *   title="No messages yet"
 *   description="When you receive messages, they'll appear here"
 *   action={<LunaButton>Send a message</LunaButton>}
 * />
 *
 * // With background and icon color
 * <LunaEmptyState
 *   icon={Video}
 *   iconBackground="blue"
 *   showBackground
 *   title="No videos added yet"
 *   description="Upload your first video to get started"
 *   size="sm"
 * />
 * ```
 */
export function LunaEmptyState({
  icon: Icon,
  title,
  description,
  action,
  size = 'md',
  iconBackground = 'none',
  showBackground = false,
  className,
  onClick,
}: LunaEmptyStateProps) {
  const config = sizeConfig[size];
  const iconBgClass = iconBackgroundConfig[iconBackground];
  const isClickable = !!onClick;

  const content = (
    <>
      {Icon && (
        <div className="mb-3">
          {iconBackground !== 'none' ? (
            <div className={cn(
              'flex items-center justify-center rounded-md',
              config.iconContainer,
              iconBgClass
            )}>
              <Icon className={cn(config.icon === 'w-12 h-12' ? 'w-5 h-5' : config.icon === 'w-16 h-16' ? 'w-5 h-5' : 'w-6 h-6')} />
            </div>
          ) : (
            <Icon className={cn(config.icon, iconBgClass)} />
          )}
        </div>
      )}

      <h3 className={cn('text-luna-gray-900 leading-none', config.title)}>
        {title}
      </h3>

      {description && (
        <p className={cn('text-luna-gray-600 max-w-md leading-tight mb-3', config.description)}>
          {description}
        </p>
      )}

      {action && <div className="flex gap-3 mt-3">{action}</div>}
    </>
  );

  if (showBackground) {
    const hasFullHeight = className?.includes('h-full');
    return (
      <div
        data-slot="luna-empty-state"
        onClick={onClick}
        className={cn(
          'bg-luna-bg-secondary border border-luna-border-light rounded-lg',
          hasFullHeight ? 'h-full flex items-center justify-center' : config.containerWithBg,
          isClickable && 'cursor-pointer hover:bg-luna-gray-100 transition-colors',
          className
        )}
      >
        <div className={cn(
          'flex flex-col items-center justify-center text-center',
          hasFullHeight && 'w-full'
        )}>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      data-slot="luna-empty-state"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        config.container,
        isClickable && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
    >
      {content}
    </div>
  );
}

