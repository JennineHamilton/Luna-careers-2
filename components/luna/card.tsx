import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Luna Card variants based on design specs:
 * - 5px border radius (rounded-md)
 * - 30px padding (p-luna-card-padding)
 * - #00185F0A border (border-luna-border-light)
 */
const lunaCardVariants = cva('bg-white rounded-md', {
  variants: {
    variant: {
      default: 'border border-luna-border-light',
      elevated: 'shadow-lg',
      bordered: 'border border-luna-border-default',
      interactive:
        'border border-luna-border-light hover:shadow-md transition-shadow cursor-pointer',
    },
    padding: {
      default: 'p-[30px]',
      none: 'p-0',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'default',
  },
});

export interface LunaCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof lunaCardVariants> {}

/**
 * LunaCard - A card component with Luna branding.
 *
 * @example
 * ```tsx
 * <LunaCard variant="default">
 *   <LunaCardHeader>
 *     <LunaCardTitle>Card Title</LunaCardTitle>
 *   </LunaCardHeader>
 *   <LunaCardContent>Content here</LunaCardContent>
 * </LunaCard>
 * ```
 */
export function LunaCard({
  className,
  variant,
  padding,
  ...props
}: LunaCardProps) {
  return (
    <div
      data-slot="luna-card"
      data-variant={variant}
      className={cn(lunaCardVariants({ variant, padding, className }))}
      {...props}
    />
  );
}

export interface LunaCardHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LunaCardHeader - Header section for LunaCard with title and optional actions.
 */
export function LunaCardHeader({
  className,
  ...props
}: LunaCardHeaderProps) {
  return (
    <div
      data-slot="luna-card-header"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
}

export interface LunaCardTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * LunaCardTitle - Title text for LunaCardHeader.
 */
export function LunaCardTitle({
  className,
  ...props
}: LunaCardTitleProps) {
  return (
    <h3
      data-slot="luna-card-title"
      className={cn('text-luna-gray-900 font-bold text-lg tracking-tight', className)}
      {...props}
    />
  );
}

export interface LunaCardSubtitleProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * LunaCardSubtitle - Subtitle text for LunaCardHeader.
 */
export function LunaCardSubtitle({
  className,
  ...props
}: LunaCardSubtitleProps) {
  return (
    <p
      data-slot="luna-card-subtitle"
      className={cn('text-luna-gray-600 text-sm', className)}
      {...props}
    />
  );
}

export interface LunaCardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LunaCardContent - Main content area for LunaCard.
 */
export function LunaCardContent({
  className,
  ...props
}: LunaCardContentProps) {
  return (
    <div
      data-slot="luna-card-content"
      className={cn('', className)}
      {...props}
    />
  );
}

export interface LunaCardFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LunaCardFooter - Footer section for LunaCard with actions and metadata.
 */
export function LunaCardFooter({
  className,
  ...props
}: LunaCardFooterProps) {
  return (
    <div
      data-slot="luna-card-footer"
      className={cn(
        'border-t border-luna-border-light pt-2.5 flex items-center gap-2',
        className
      )}
      {...props}
    />
  );
}

export { lunaCardVariants };

