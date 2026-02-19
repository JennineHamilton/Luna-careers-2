import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Luna Badge variants for status indicators.
 */
const lunaBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md font-medium',
  {
    variants: {
      variant: {
        default: 'bg-luna-gray-100 text-luna-gray-700',
        primary: 'bg-luna-blue/10 text-luna-blue',
        success: 'bg-luna-success/10 text-luna-success',
        warning: 'bg-luna-warning/10 text-luna-warning',
        error: 'bg-luna-error/10 text-luna-error',
        yellow: 'bg-luna-yellow/20 text-luna-navy',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

/** Dot color mapping for variants */
const dotColorMap: Record<string, string> = {
  default: 'bg-luna-gray-500',
  primary: 'bg-luna-blue',
  success: 'bg-luna-success',
  warning: 'bg-luna-warning',
  error: 'bg-luna-error',
  yellow: 'bg-luna-navy',
};

export interface LunaBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof lunaBadgeVariants> {
  /** Show a colored dot indicator on the left */
  dot?: boolean;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
}

/**
 * LunaBadge - A small status indicator with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaBadge variant="success">Active</LunaBadge>
 * <LunaBadge variant="warning" dot>Pending</LunaBadge>
 * <LunaBadge variant="error" onDismiss={() => {}}>Error</LunaBadge>
 * ```
 */
export function LunaBadge({
  className,
  variant = 'default',
  size,
  dot,
  onDismiss,
  children,
  ...props
}: LunaBadgeProps) {
  const dotColor = dotColorMap[variant || 'default'];

  return (
    <span
      data-slot="luna-badge"
      data-variant={variant}
      className={cn(lunaBadgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)}
          aria-hidden="true"
        />
      )}
      {children}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-0.5 -mr-1 rounded hover:bg-black/10 p-0.5 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-luna-blue"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

export { lunaBadgeVariants };

