'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Luna Button variants using cva for type-safe variant management.
 * All variants use Luna design tokens exclusively.
 */
const lunaButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-luna-blue text-white hover:bg-luna-blue/90',
        secondary:
          'bg-luna-gray-100 text-luna-gray-900 hover:bg-luna-gray-200',
        outline:
          'border border-luna-blue text-luna-blue hover:bg-luna-blue hover:text-white bg-transparent',
        ghost: 'text-luna-blue hover:bg-luna-gray-100 bg-transparent',
        danger: 'bg-luna-error text-white hover:bg-luna-error/90',
        success: 'bg-luna-success text-white hover:bg-luna-success/90',
      },
      size: {
        xs: 'px-2.5 py-1.5 text-xs',
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface LunaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof lunaButtonVariants> {
  /** Show loading spinner and disable interaction */
  loading?: boolean;
  /** Icon to display on the left side of the button text */
  icon?: React.ReactNode;
  /** Render as a different element using Radix Slot */
  asChild?: boolean;
}

/**
 * LunaButton - A button component with Luna branding.
 *
 * @example
 * ```tsx
 * <LunaButton variant="primary" size="md">
 *   Click me
 * </LunaButton>
 *
 * <LunaButton variant="outline" loading>
 *   Submitting...
 * </LunaButton>
 *
 * <LunaButton variant="ghost" icon={<PlusIcon />}>
 *   Add Item
 * </LunaButton>
 * ```
 */
export function LunaButton({
  className,
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  icon,
  asChild = false,
  children,
  ...props
}: LunaButtonProps) {
  const Comp = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;

  return (
    <Comp
      data-slot="luna-button"
      data-variant={variant}
      data-size={size}
      data-loading={loading}
      className={cn(lunaButtonVariants({ variant, size, fullWidth, className }))}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading</span>
          {children}
        </>
      ) : (
        <>
          {icon && <span aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </Comp>
  );
}

export { lunaButtonVariants };
export type { VariantProps };

