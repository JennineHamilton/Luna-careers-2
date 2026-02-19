'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaCheckboxProps
  extends React.ComponentProps<typeof CheckboxPrimitive.Root> {
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Small description text below the label */
  description?: string;
  /** Error message */
  error?: string;
}

/**
 * LunaCheckbox - A custom styled checkbox with Luna branding.
 *
 * @example
 * ```tsx
 * <LunaCheckbox
 *   label="Accept terms and conditions"
 *   description="You must accept before continuing"
 * />
 * ```
 */
export function LunaCheckbox({
  className,
  label,
  description,
  error,
  id,
  disabled,
  ...props
}: LunaCheckboxProps) {
  const checkboxId = id || React.useId();
  const hasError = !!error;

  return (
    <div data-slot="luna-checkbox-wrapper" className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <CheckboxPrimitive.Root
          id={checkboxId}
          data-slot="luna-checkbox"
          disabled={disabled}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded border-2 transition-colors',
            'border-luna-gray-300 bg-white',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2',
            'disabled:bg-luna-gray-100 disabled:border-luna-gray-300 disabled:cursor-not-allowed',
            'data-[state=checked]:bg-luna-blue data-[state=checked]:border-luna-blue',
            hasError && 'border-luna-error',
            className
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator
            data-slot="luna-checkbox-indicator"
            className="flex items-center justify-center text-white"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {(label || description) && (
          <div className="flex flex-col gap-0.5">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'text-sm font-medium text-luna-gray-900 cursor-pointer',
                  disabled && 'cursor-not-allowed opacity-50'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                className={cn(
                  'text-sm text-luna-gray-500',
                  disabled && 'opacity-50'
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-luna-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

